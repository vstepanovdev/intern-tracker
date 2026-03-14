from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Company
from schemas import (
    CompanyCreate,
    CompanyOut,
    CompanySuggestion,
    CompanyWithApplications,
)

router = APIRouter(prefix="/api/companies", tags=["companies"])

COMPANY_SUGGESTIONS: list[dict] = [
    {"name": "Google", "website": "https://careers.google.com", "industry": "Technology", "size": "large", "location": "Mountain View, CA",
     "apply_url": "https://www.google.com/about/careers/applications/jobs/results/?q=intern&target_level=INTERN_AND_APPRENTICE", "intern_position": "Software Engineering Intern", "tips": "Focus on DSA, system design basics. Apply early (Sept-Oct). Online assessment first."},
    {"name": "Meta", "website": "https://www.metacareers.com", "industry": "Social Media / Technology", "size": "large", "location": "Menlo Park, CA",
     "apply_url": "https://www.metacareers.com/jobs?q=software%20engineer%20intern", "intern_position": "Software Engineer Intern", "tips": "Two coding rounds + behavioral. Strong on graphs, trees, dynamic programming."},
    {"name": "Apple", "website": "https://jobs.apple.com", "industry": "Consumer Electronics / Technology", "size": "large", "location": "Cupertino, CA",
     "apply_url": "https://jobs.apple.com/en-us/search?search=intern&sort=relevance", "intern_position": "Software Engineering Intern", "tips": "Team-matching after interview. Emphasize projects and passion for Apple products."},
    {"name": "Microsoft", "website": "https://careers.microsoft.com", "industry": "Technology", "size": "large", "location": "Redmond, WA",
     "apply_url": "https://careers.microsoft.com/v2/global/en/programs/students.html", "intern_position": "Software Engineering Intern", "tips": "Apply via Explore (1st/2nd yr) or SWE Intern. Online assessment + 2 interviews. Focus on coding + design."},
    {"name": "Amazon", "website": "https://www.amazon.jobs", "industry": "E-commerce / Cloud", "size": "large", "location": "Seattle, WA",
     "apply_url": "https://www.amazon.jobs/en/search?offset=0&result_limit=10&sort=relevant&category=software-development&job_type=Intern", "intern_position": "SDE Intern", "tips": "Leadership Principles are key. OA has 2 coding + work simulation. Apply Aug-Oct."},
    {"name": "Netflix", "website": "https://jobs.netflix.com", "industry": "Streaming / Entertainment", "size": "large", "location": "Los Gatos, CA",
     "apply_url": "https://jobs.netflix.com/search?q=intern", "intern_position": "Software Engineering Intern", "tips": "Smaller intern class, very selective. Emphasize independence and ownership."},
    {"name": "NVIDIA", "website": "https://www.nvidia.com/en-us/about-nvidia/careers/", "industry": "Technology / AI Hardware", "size": "large", "location": "Santa Clara, CA",
     "apply_url": "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite?q=intern&locationCountry=bc33aa3152ec42d4995f4791a106ed09", "intern_position": "Software Engineering Intern", "tips": "Strong C/C++, GPU/parallel computing knowledge a plus. Growing AI focus."},
    {"name": "Stripe", "website": "https://stripe.com/jobs", "industry": "Fintech", "size": "mid", "location": "San Francisco, CA",
     "apply_url": "https://stripe.com/jobs/search?query=intern", "intern_position": "Software Engineering Intern", "tips": "Focus on clean code, systems thinking. Ruby/Java/Python. Small cohort, high mentorship."},
    {"name": "Airbnb", "website": "https://careers.airbnb.com", "industry": "Travel / Technology", "size": "mid", "location": "San Francisco, CA",
     "apply_url": "https://careers.airbnb.com/positions/?query=intern", "intern_position": "Software Engineering Intern", "tips": "Emphasize collaboration and belonging values. Full-stack skills valued."},
    {"name": "Uber", "website": "https://www.uber.com/careers", "industry": "Transportation / Technology", "size": "large", "location": "San Francisco, CA",
     "apply_url": "https://www.uber.com/us/en/careers/list/?query=intern&department=Engineering", "intern_position": "Software Engineering Intern", "tips": "Online assessment + phone screen + virtual onsite. Distributed systems focus."},
    {"name": "Lyft", "website": "https://www.lyft.com/careers", "industry": "Transportation / Technology", "size": "mid", "location": "San Francisco, CA",
     "apply_url": "https://www.lyft.com/careers?search=intern", "intern_position": "Software Engineering Intern", "tips": "Smaller program, great mentorship. Python/Go experience valued."},
    {"name": "Spotify", "website": "https://www.lifeatspotify.com", "industry": "Music Streaming", "size": "mid", "location": "Stockholm, Sweden",
     "apply_url": "https://www.lifeatspotify.com/jobs?query=intern", "intern_position": "Backend/ML Engineering Intern", "tips": "Apply early, competitive. Passion for music tech is a plus."},
    {"name": "Dropbox", "website": "https://www.dropbox.com/jobs", "industry": "Cloud Storage", "size": "mid", "location": "San Francisco, CA",
     "apply_url": "https://www.dropbox.com/jobs/search?q=intern", "intern_position": "Software Engineering Intern", "tips": "Focus on system design and coding fundamentals. Virtual-first culture."},
    {"name": "Palantir", "website": "https://www.palantir.com/careers", "industry": "Data Analytics", "size": "mid", "location": "Denver, CO",
     "apply_url": "https://www.palantir.com/careers/#open-positions", "intern_position": "Software Engineering Intern", "tips": "Karat interview + onsite decomposition. Strong on algorithms and problem decomposition."},
    {"name": "Databricks", "website": "https://www.databricks.com/company/careers", "industry": "Data / AI", "size": "mid", "location": "San Francisco, CA",
     "apply_url": "https://www.databricks.com/company/careers/open-positions?department=University+Recruiting", "intern_position": "Software Engineering Intern", "tips": "Spark/big data knowledge is a bonus. Fast-growing, strong engineering culture."},
    {"name": "Snowflake", "website": "https://careers.snowflake.com", "industry": "Cloud Data", "size": "mid", "location": "Bozeman, MT",
     "apply_url": "https://careers.snowflake.com/us/en/search-results?keywords=intern", "intern_position": "Software Engineering Intern", "tips": "C++ and database internals knowledge valued. Rapidly growing."},
    {"name": "Cloudflare", "website": "https://www.cloudflare.com/careers", "industry": "Internet Security / CDN", "size": "mid", "location": "San Francisco, CA",
     "apply_url": "https://www.cloudflare.com/careers/jobs/?department=Emerging+Talent", "intern_position": "Software Engineering Intern", "tips": "Systems/networking focus. Rust/Go a plus. Great blog—read it before interviews."},
    {"name": "Figma", "website": "https://www.figma.com/careers", "industry": "Design Tools", "size": "mid", "location": "San Francisco, CA",
     "apply_url": "https://www.figma.com/careers/#job-openings", "intern_position": "Software Engineering Intern", "tips": "Show passion for design tools. C++/WebGL knowledge for render team."},
    {"name": "Notion", "website": "https://www.notion.so/careers", "industry": "Productivity / SaaS", "size": "startup", "location": "San Francisco, CA",
     "apply_url": "https://www.notion.so/careers#702702", "intern_position": "Software Engineering Intern", "tips": "Small cohort. Strong full-stack skills valued. Show you use/love Notion."},
    {"name": "Vercel", "website": "https://vercel.com/careers", "industry": "Developer Tools", "size": "startup", "location": "San Francisco, CA",
     "apply_url": "https://vercel.com/careers", "intern_position": "Software Engineering Intern", "tips": "Next.js/React expertise is key. Open source contributions noticed."},
    {"name": "Supabase", "website": "https://supabase.com/careers", "industry": "Developer Tools / BaaS", "size": "startup", "location": "Remote",
     "apply_url": "https://supabase.com/careers#positions", "intern_position": "Software Engineering Intern", "tips": "Postgres/TypeScript focus. Open source contributors get priority."},
    {"name": "MongoDB", "website": "https://www.mongodb.com/careers", "industry": "Database / Cloud", "size": "mid", "location": "New York, NY",
     "apply_url": "https://www.mongodb.com/careers/departments/college-students", "intern_position": "Software Engineering Intern", "tips": "Database fundamentals matter. C++/Go experience valued."},
    {"name": "Elastic", "website": "https://www.elastic.co/careers", "industry": "Search / Analytics", "size": "mid", "location": "San Francisco, CA",
     "apply_url": "https://www.elastic.co/careers#engineering", "intern_position": "Software Engineering Intern", "tips": "Distributed systems knowledge. Java a plus. Remote-friendly culture."},
    {"name": "Twilio", "website": "https://www.twilio.com/company/jobs", "industry": "Communication APIs", "size": "mid", "location": "San Francisco, CA",
     "apply_url": "https://www.twilio.com/company/jobs?department=Emerging%20Talent", "intern_position": "Software Engineering Intern", "tips": "API design knowledge valued. Show projects using Twilio if possible."},
    {"name": "Square (Block)", "website": "https://block.xyz/careers", "industry": "Fintech", "size": "mid", "location": "San Francisco, CA",
     "apply_url": "https://block.xyz/careers?query=intern", "intern_position": "Software Engineering Intern", "tips": "Mobile (iOS/Android) or backend focus. Fintech passion helps."},
    {"name": "Coinbase", "website": "https://www.coinbase.com/careers", "industry": "Cryptocurrency / Fintech", "size": "mid", "location": "Remote",
     "apply_url": "https://www.coinbase.com/careers/positions?query=intern", "intern_position": "Software Engineering Intern", "tips": "Crypto/blockchain interest a plus. Remote-first. Security-minded culture."},
    {"name": "Robinhood", "website": "https://robinhood.com/careers", "industry": "Fintech", "size": "mid", "location": "Menlo Park, CA",
     "apply_url": "https://robinhood.com/us/en/careers/openings/?department=University", "intern_position": "Software Engineering Intern", "tips": "Python/Go backend. Low-latency systems interest is a plus."},
    {"name": "Bloomberg", "website": "https://www.bloomberg.com/careers", "industry": "Financial Data / Technology", "size": "large", "location": "New York, NY",
     "apply_url": "https://www.bloomberg.com/company/careers/early-career/", "intern_position": "Software Engineering Intern", "tips": "C++ heavy. Apply early, structured program. NYC-based primarily."},
    {"name": "JPMorgan", "website": "https://careers.jpmorgan.com", "industry": "Banking / Technology", "size": "large", "location": "New York, NY",
     "apply_url": "https://careers.jpmorgan.com/us/en/students/programs/software-engineer-summer", "intern_position": "Software Engineer Intern", "tips": "CodeVue assessment first. Java focus. Massive intern cohort, good networking."},
    {"name": "Goldman Sachs", "website": "https://www.goldmansachs.com/careers", "industry": "Banking / Technology", "size": "large", "location": "New York, NY",
     "apply_url": "https://www.goldmansachs.com/careers/students/programs/americas/summer-analyst.html", "intern_position": "Summer Analyst - Engineering", "tips": "HackerRank assessment + Hirevue. Java/Python. Apply July-Sept for next summer."},
]


@router.get("/suggestions", response_model=list[CompanySuggestion])
def get_suggestions():
    return COMPANY_SUGGESTIONS


@router.get("/", response_model=list[CompanyOut])
def list_companies(db: Session = Depends(get_db)):
    return db.query(Company).order_by(Company.name).all()


@router.get("/{company_id}", response_model=CompanyWithApplications)
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = (
        db.query(Company)
        .options(joinedload(Company.applications))
        .filter(Company.id == company_id)
        .first()
    )
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post("/", response_model=CompanyOut, status_code=201)
def create_company(data: CompanyCreate, db: Session = Depends(get_db)):
    existing = db.query(Company).filter(Company.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Company with this name already exists")
    company = Company(**data.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company
