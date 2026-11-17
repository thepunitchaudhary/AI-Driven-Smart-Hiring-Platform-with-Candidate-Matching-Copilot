import os

from parser.pdf_parser import extract_text_pdf
from parser.docx_parser import extract_text_docx
from extraction.contact_extractor import extract_email, extract_phone, extract_name, extract_location, looks_like_name
from extraction.skill_extractor import extract_skills, canonical_skill
from extraction.education_extractor import extract_education, education_to_text
from extraction.experience_extractor import extract_experience
from extraction.section_extractor import get_projects, get_certifications

ResumeParser = None
if os.getenv("USE_PYRESPARSER", "").lower() == "true":
    try:
        from pyresparser import ResumeParser
    except Exception:
        ResumeParser = None


def extract_resume_text(path):
    if path.lower().endswith(".pdf"):
        return extract_text_pdf(path)
    elif path.lower().endswith(".docx"):
        return extract_text_docx(path)
    else:
        raise ValueError("Only PDF and DOCX files are supported")


def merge_pyresparser(path, profile):
    if ResumeParser is None:
        return profile
    try:
        data = ResumeParser(path).get_extracted_data()
    except Exception:
        return profile
    if not profile["name"] and data.get("name") and looks_like_name(data["name"]):
        profile["name"] = data["name"].title()
    if not profile["email"] and data.get("email"):
        profile["email"] = data["email"]
    if not profile["phone"] and data.get("mobile_number"):
        profile["phone"] = data["mobile_number"]
    for skill in data.get("skills") or []:
        name = canonical_skill(skill)
        if name and name not in profile["skills"]:
            profile["skills"].append(name)
    return profile


def parse_resume(path):
    text = extract_resume_text(path)
    details = extract_education(text)
    experience, years = extract_experience(text)
    profile = {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "location": extract_location(text),
        "education": education_to_text(details),
        "education_details": details,
        "experience": experience,
        "experience_years": years,
        "skills": extract_skills(text),
        "projects": get_projects(text),
        "certifications": get_certifications(text),
    }
    return merge_pyresparser(path, profile)


def build_final_json(profile, candidate_id):
    return {
        "candidate_id": "C%03d" % candidate_id,
        "name": profile["name"],
        "email": profile["email"],
        "phone": profile["phone"],
        "location": profile["location"],
        "skills": profile["skills"],
        "education": profile["education_details"],
        "experience_years": profile["experience_years"],
        "projects": profile["projects"],
        "certifications": profile["certifications"],
    }


def calculate_accuracy(profile):
    fields = ["name", "email", "phone", "education", "experience", "skills"]
    filled = 0
    for field in fields:
        if profile[field]:
            filled = filled + 1
    return round(filled / len(fields) * 100, 2)
