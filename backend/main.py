import sys
import os

# Ensure the backend package directory is on sys.path so sibling modules resolve.
sys.path.insert(0, os.path.dirname(__file__))

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import applications, companies, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Internship Application Tracker",
    description="API for tracking internship applications",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow everything for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applications.router)
app.include_router(companies.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "Internship Application Tracker API", "docs": "/docs"}
