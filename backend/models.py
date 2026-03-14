from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, ForeignKey,
)
from sqlalchemy.orm import relationship

from database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    website = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    size = Column(String, nullable=True)
    location = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    applications = relationship("Application", back_populates="company", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    position = Column(String, nullable=False)
    status = Column(String, nullable=False, default="wishlist")
    url = Column(String, nullable=True)
    date_applied = Column(Date, nullable=True)
    date_updated = Column(Date, default=date.today, onupdate=date.today)
    deadline = Column(Date, nullable=True)
    cover_letter = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    resume_version = Column(String, nullable=True)
    contact_name = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="applications")
