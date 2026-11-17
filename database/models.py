import json
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime

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
    created_at = Column(DateTime, default=datetime.now)


Base.metadata.create_all(engine)


def save_candidate(profile, resume_path):
    with Session() as session:
        candidate = Candidate(
            name=profile["name"],
            email=profile["email"],
            phone=profile["phone"],
            location=profile["location"],
            education=json.dumps(profile["education_details"]),
            experience=profile["experience"],
            skills=json.dumps(profile["skills"]),
            projects=json.dumps(profile["projects"]),
            certifications=json.dumps(profile["certifications"]),
            resume_path=resume_path,
        )
        session.add(candidate)
        session.commit()
        return candidate.candidate_id
