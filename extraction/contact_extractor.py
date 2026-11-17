import re
from extraction.nlp_model import nlp
from extraction.section_extractor import get_lines, get_header_lines, is_heading

TITLE_WORDS = [
    "manager", "assistant", "engineer", "developer", "analyst", "coordinator", "administrator",
    "executive", "consultant", "designer", "specialist", "director", "officer", "intern",
    "scientist", "resume", "cv", "curriculum", "vitae", "summary", "profile", "objective",
    "skills", "experience", "education", "hr", "sales", "marketing", "accountant", "teacher",
    "lead", "associate", "representative", "technician", "architect", "supervisor", "clerk",
    "secretary", "trainer", "advisor", "benefits", "personnel", "payroll", "recruiter",
    "programmer", "tester", "student", "fresher", "professional", "senior", "junior", "data",
    "software", "web", "business", "customer", "service", "operations", "finance", "banking",
    "accounting", "human", "resources", "contact", "details", "personal", "information",
    "projects", "certifications", "technical", "career", "about", "me",
]


def extract_email(text):
    emails = re.findall(r"[\w\.\-+]+@[\w\-]+(?:\.[\w\-]+)+", text)
    if len(emails) > 0:
        return emails[0]
    return ""


def extract_phone(text):
    patterns = [
        r"(?<![\d])(?:\+?91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}(?![\d])",
        r"(?<![\d])(?:\+?1[\s\-]?)?\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}(?![\d])",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0).strip()
    return ""


def looks_like_name(value):
    words = value.split()
    if not 2 <= len(words) <= 4:
        return False
    if not all(re.match(r"^[A-Za-z][A-Za-z\.\-']*$", w) for w in words):
        return False
    if any(w.lower().strip(".") in TITLE_WORDS for w in words):
        return False
    return True


def spacy_entities(text, labels):
    if nlp is None:
        return []
    header = "\n".join(get_header_lines(text))
    if header == "":
        return []
    found = []
    for ent in nlp(header).ents:
        if ent.label_ in labels:
            found.append(" ".join(ent.text.split()))
    return found


def extract_name(text):
    match = re.search(r"^\s*name\s*[:\-]\s*([A-Za-z\.\' ]+)$", text, re.IGNORECASE | re.MULTILINE)
    if match:
        return match.group(1).strip().title()
    for line in get_lines(text)[:6]:
        if "@" in line or any(ch.isdigit() for ch in line):
            continue
        if is_heading(line):
            continue
        if looks_like_name(line):
            return line.title()
    for person in spacy_entities(text, ["PERSON"]):
        if looks_like_name(person):
            return person.title()
    return ""


def extract_location(text):
    match = re.search(r"(?:location|address|city)\s*[:\-]\s*(.+)", text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    for line in get_lines(text)[:10]:
        for part in re.split(r"\s*[|\u2022\u00b7]\s*", line):
            part = part.strip()
            if "@" in part or any(ch.isdigit() for ch in part):
                continue
            if not re.match(r"^[A-Z][A-Za-z\.\s]+,\s*[A-Z][A-Za-z\.\s]+$", part):
                continue
            words = re.split(r"[\s,]+", part.lower())
            if any(w in TITLE_WORDS or w in ("university", "college", "institute") for w in words):
                continue
            return part
    for place in spacy_entities(text, ["GPE", "LOC"]):
        words = place.lower().split()
        if not any(w in TITLE_WORDS for w in words):
            return place
    return ""
