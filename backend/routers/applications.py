from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Application, Company
from schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationUpdate,
    VALID_STATUSES,
)

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("/", response_model=list[ApplicationOut])
def list_applications(
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
):
    query = db.query(Application).options(joinedload(Application.company))
    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{status}'. Must be one of: {', '.join(VALID_STATUSES)}",
            )
        query = query.filter(Application.status == status)
    return query.order_by(Application.date_updated.desc()).all()


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(application_id: int, db: Session = Depends(get_db)):
    app = (
        db.query(Application)
        .options(joinedload(Application.company))
        .filter(Application.id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.post("/", response_model=ApplicationOut, status_code=201)
def create_application(data: ApplicationCreate, db: Session = Depends(get_db)):
    if data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{data.status}'. Must be one of: {', '.join(VALID_STATUSES)}",
        )

    # Resolve company
    company_id = data.company_id
    if data.company_name and not company_id:
        company = db.query(Company).filter(Company.name == data.company_name).first()
        if not company:
            company = Company(name=data.company_name)
            db.add(company)
            db.flush()
        company_id = company.id

    if not company_id:
        raise HTTPException(
            status_code=400,
            detail="Either company_id or company_name must be provided",
        )

    # Verify company exists when company_id was provided directly
    if data.company_id:
        exists = db.query(Company).filter(Company.id == company_id).first()
        if not exists:
            raise HTTPException(status_code=404, detail="Company not found")

    app = Application(
        company_id=company_id,
        position=data.position,
        status=data.status,
        url=data.url,
        date_applied=data.date_applied,
        date_updated=date.today(),
        deadline=data.deadline,
        cover_letter=data.cover_letter,
        notes=data.notes,
        resume_version=data.resume_version,
        contact_name=data.contact_name,
        contact_email=data.contact_email,
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    # Eagerly load company for response
    return (
        db.query(Application)
        .options(joinedload(Application.company))
        .filter(Application.id == app.id)
        .first()
    )


@router.put("/{application_id}", response_model=ApplicationOut)
def update_application(
    application_id: int,
    data: ApplicationUpdate,
    db: Session = Depends(get_db),
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    update_data = data.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{update_data['status']}'. Must be one of: {', '.join(VALID_STATUSES)}",
        )

    if "company_id" in update_data:
        exists = db.query(Company).filter(Company.id == update_data["company_id"]).first()
        if not exists:
            raise HTTPException(status_code=404, detail="Company not found")

    for field, value in update_data.items():
        setattr(app, field, value)

    app.date_updated = date.today()
    db.commit()
    db.refresh(app)

    return (
        db.query(Application)
        .options(joinedload(Application.company))
        .filter(Application.id == app.id)
        .first()
    )


@router.delete("/{application_id}", status_code=204)
def delete_application(application_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app)
    db.commit()
    return None


@router.post("/quick-apply", response_model=list[ApplicationOut], status_code=201)
def quick_apply(entries: list[ApplicationCreate], db: Session = Depends(get_db)):
    """Create multiple applications at once (batch quick-apply)."""
    results = []
    for data in entries:
        company_id = data.company_id
        if data.company_name and not company_id:
            company = db.query(Company).filter(Company.name == data.company_name).first()
            if not company:
                company = Company(name=data.company_name)
                db.add(company)
                db.flush()
            company_id = company.id

        if not company_id:
            continue

        # Skip if application already exists for same company+position
        existing = (
            db.query(Application)
            .join(Company)
            .filter(Company.id == company_id, Application.position == data.position)
            .first()
        )
        if existing:
            results.append(existing)
            continue

        app = Application(
            company_id=company_id,
            position=data.position,
            status=data.status or "applied",
            url=data.url,
            date_applied=data.date_applied or date.today(),
            date_updated=date.today(),
            cover_letter=data.cover_letter,
            notes=data.notes,
        )
        db.add(app)
        db.flush()
        results.append(app)

    db.commit()
    return (
        db.query(Application)
        .options(joinedload(Application.company))
        .filter(Application.id.in_([a.id for a in results]))
        .all()
    )


@router.post("/{application_id}/generate-cover-letter")
def generate_cover_letter(application_id: int, db: Session = Depends(get_db)):
    app = (
        db.query(Application)
        .options(joinedload(Application.company))
        .filter(Application.id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    company_name = app.company.name
    position = app.position

    cover_letter = f"""Dear Hiring Manager at {company_name},

I am writing to express my strong interest in the {position} position at {company_name}. As a Computer Science student with a passion for technology and software development, I am excited about the opportunity to contribute to your team.

Throughout my academic career, I have developed a solid foundation in data structures, algorithms, and software engineering principles. I have hands-on experience with modern development tools and frameworks, and I am eager to apply my skills in a real-world setting.

I am particularly drawn to {company_name} because of its reputation for innovation and its commitment to engineering excellence. I believe that an internship at {company_name} would provide me with invaluable experience and the opportunity to learn from some of the best engineers in the industry.

I am a quick learner, a strong communicator, and a collaborative team player. I am confident that I would be a valuable addition to your team and would make the most of the opportunity to grow as a software engineer.

Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to {company_name}.

Sincerely,
[Your Name]
[Your Email]
[Your Phone]"""

    return {"cover_letter": cover_letter}
