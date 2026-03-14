from datetime import date, timedelta
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Application
from schemas import ApplicationOut, DashboardStats, TimelineWeek, VALID_STATUSES

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    applications = (
        db.query(Application)
        .options(joinedload(Application.company))
        .order_by(Application.date_updated.desc())
        .all()
    )

    by_status: dict[str, int] = {s: 0 for s in VALID_STATUSES}
    for app in applications:
        if app.status in by_status:
            by_status[app.status] += 1

    recent = applications[:10]

    return DashboardStats(
        total=len(applications),
        by_status=by_status,
        recent_applications=recent,
    )


def _iso_week_start(d: date) -> str:
    """Return the Monday of the ISO week as an ISO-formatted string."""
    monday = d - timedelta(days=d.weekday())
    return monday.isoformat()


@router.get("/timeline", response_model=list[TimelineWeek])
def get_timeline(db: Session = Depends(get_db)):
    applications = (
        db.query(Application)
        .options(joinedload(Application.company))
        .order_by(Application.date_updated.desc())
        .all()
    )

    weeks: dict[str, list] = defaultdict(list)
    for app in applications:
        ref_date = app.date_applied or (app.date_updated if app.date_updated else app.created_at.date())
        week_key = _iso_week_start(ref_date)
        weeks[week_key].append(app)

    result = [
        TimelineWeek(week=week, count=len(apps), applications=apps)
        for week, apps in sorted(weeks.items(), reverse=True)
    ]
    return result
