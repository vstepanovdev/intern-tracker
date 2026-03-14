from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


# ── Company ──────────────────────────────────────────────────────────────────

class CompanyBase(BaseModel):
    name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class CompanyOut(CompanyBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Application ──────────────────────────────────────────────────────────────

VALID_STATUSES = [
    "wishlist",
    "applied",
    "phone_screen",
    "interview",
    "offer",
    "rejected",
    "withdrawn",
]


class ApplicationBase(BaseModel):
    position: str
    status: str = "wishlist"
    url: Optional[str] = None
    date_applied: Optional[date] = None
    deadline: Optional[date] = None
    cover_letter: Optional[str] = None
    notes: Optional[str] = None
    resume_version: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    company_id: Optional[int] = None
    company_name: Optional[str] = None


class ApplicationUpdate(BaseModel):
    position: Optional[str] = None
    status: Optional[str] = None
    url: Optional[str] = None
    date_applied: Optional[date] = None
    deadline: Optional[date] = None
    cover_letter: Optional[str] = None
    notes: Optional[str] = None
    resume_version: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    company_id: Optional[int] = None


class ApplicationOut(ApplicationBase):
    id: int
    company_id: int
    date_updated: Optional[date] = None
    created_at: datetime
    company: CompanyOut

    model_config = {"from_attributes": True}


# ── Company with applications ────────────────────────────────────────────────

class ApplicationBrief(ApplicationBase):
    id: int
    company_id: int
    date_updated: Optional[date] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CompanyWithApplications(CompanyOut):
    applications: list[ApplicationBrief] = []

    model_config = {"from_attributes": True}


# ── Dashboard ────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total: int
    by_status: dict[str, int]
    recent_applications: list[ApplicationOut]


class TimelineWeek(BaseModel):
    week: str
    count: int
    applications: list[ApplicationOut]


# ── Company suggestion ───────────────────────────────────────────────────────

class CompanySuggestion(BaseModel):
    name: str
    website: str
    industry: str
    size: str
    location: str
    apply_url: str = ""
    intern_position: str = "Software Engineering Intern"
    tips: str = ""
