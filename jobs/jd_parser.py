import re
from extraction.skill_extractor import extract_skills
from extraction.education_extractor import DEGREE_PATTERN

PREFERRED_WORDS = ["preferred", "nice to have", "good to have", "bonus", "optional", "added advantage"]
REQUIRED_WORDS = ["required", "must have", "requirements", "qualifications", "responsibilities", "mandatory"]


def find_experience(text):
    match = re.search(r"(\d+)\s*\+?\s*(?:-\s*\d+\s*)?(?:years?|yrs?)", text, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return 0


def find_education(text):
    match = DEGREE_PATTERN.search(text)
    if match:
        return match.group(0).strip()
    match = re.search(r"\b(bachelor|master|ph\.?d|diploma)", text, re.IGNORECASE)
    if match:
        return match.group(1).title()
    return ""


def split_skills(text):
    required = []
    preferred = []
    mode = "required"
    for line in text.split("\n"):
        lower = line.lower()
        if any(word in lower for word in PREFERRED_WORDS):
            mode = "preferred"
        elif any(word in lower for word in REQUIRED_WORDS):
            mode = "required"
        for skill in extract_skills(line):
            target = preferred if mode == "preferred" else required
            if skill not in required and skill not in preferred:
                target.append(skill)
    return required, preferred


def analyze_jd(text):
    required, preferred = split_skills(text)
    certifications = [line.strip(" -\u2022*") for line in text.split("\n") if "certif" in line.lower()][:3]
    return {
        "required_skills": required,
        "preferred_skills": preferred,
        "experience_years": find_experience(text),
        "education": find_education(text),
        "certifications": certifications,
    }


def extract_jd_skills(text):
    required, preferred = split_skills(text)
    return required + preferred
