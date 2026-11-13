import json
import os
from datetime import datetime

from dotenv import load_dotenv

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "recruitment_db")

DATABASE_URL = URL.create(
    drivername="postgresql+psycopg",
    username=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT,
    database=DB_NAME
)

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
Base = declarative_base()


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
            education=json.dumps(profile["education"]),
            experience=profile["experience"],
            skills=json.dumps(profile["skills"]),
            projects=json.dumps(profile["projects"]),
            certifications=json.dumps(profile["certifications"]),
            resume_path=resume_path,
        )
        session.add(candidate)
        session.commit()
        return candidate.candidate_id
