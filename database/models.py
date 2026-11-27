import json
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, inspect, text

from database.db import Base, engine, Session


class Candidate(Base):
    __tablename__ = "candidates"

    candidate_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200))
    email = Column(String(100))
    phone = Column(String(50))
    location = Column(Text)
    education = Column(Text)
    experience = Column(Text)
    skills = Column(Text)
    projects = Column(Text)
    certifications = Column(Text)
    resume_path = Column(String(255))
    owner_user_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)


class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200))
    department = Column(String(100))
    city = Column(String(100))
    job_type = Column(String(50))
    experience_years = Column(Integer, default=0)
    education = Column(String(100))
    required_skills = Column(Text)
    preferred_skills = Column(Text)
    description = Column(Text)
    status = Column(String(20), default="pending")
    posted_by = Column(Integer)
    posted_by_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.now)


class Application(Base):
    __tablename__ = "applications"

    application_id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer)
    candidate_id = Column(Integer)
    user_id = Column(Integer)
    status = Column(String(20), default="applied")
    match_score = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)


Base.metadata.create_all(engine)


def add_owner_column():
    names = [column["name"] for column in inspect(engine).get_columns("candidates")]
    if "owner_user_id" not in names:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE candidates ADD COLUMN owner_user_id INTEGER"))


add_owner_column()


def save_candidate(profile, resume_path, owner_user_id=None):
    with Session() as session:
        row = None
        if owner_user_id is not None:
            row = (session.query(Candidate)
                   .filter(Candidate.owner_user_id == owner_user_id)
                   .order_by(Candidate.candidate_id.desc()).first())
        if row is None:
            row = Candidate(owner_user_id=owner_user_id)
            session.add(row)
        row.name = profile["name"]
        row.email = profile["email"]
        row.phone = profile["phone"]
        row.location = profile["location"]
        row.education = json.dumps(profile["education_details"])
        row.experience = profile["experience"]
        row.skills = json.dumps(profile["skills"])
        row.projects = json.dumps(profile["projects"])
        row.certifications = json.dumps(profile["certifications"])
        row.resume_path = resume_path
        session.commit()
        return row.candidate_id


def find_by_email(email, exclude_id=None):
    if not email:
        return None
    with Session() as session:
        rows = session.query(Candidate).filter(Candidate.email.ilike(email.strip())).all()
        for row in rows:
            if row.candidate_id != exclude_id:
                return row.candidate_id
    return None
