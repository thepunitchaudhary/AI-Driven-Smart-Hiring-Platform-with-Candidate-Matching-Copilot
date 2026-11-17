import re
from extraction.nlp_model import nlp
from extraction.section_extractor import get_lines, get_section

DEGREE_PATTERN = re.compile(
    r"\b(B\.?Tech|M\.?Tech|B\.E|M\.E|B\.?Sc|M\.?Sc|BCA|MCA|MBA|B\.?Com|M\.?Com|Ph\.?D|PhD|"
    r"Bachelors?\s+(?:of|in)\s+[A-Z][A-Za-z]+(?:\s+[A-Za-z]+){0,3}|"
    r"Masters?\s+(?:of|in)\s+[A-Z][A-Za-z]+(?:\s+[A-Za-z]+){0,3}|"
    r"Associate\s+(?:of|in)\s+[A-Z][A-Za-z]+(?:\s+[A-Za-z]+){0,3}|Diploma)"
)

UNIVERSITY_PATTERNS = [
    r"University of [A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+){0,2}",
    r"(?:[A-Z][\w\.&']*\s+){0,6}Institute of [A-Z][A-Za-z]+",
    r"(?:[A-Z][\w\.&']*\s+){1,6}(?:University|College|School|Institute)",
]


COLLEGE_WORDS = ["university", "college", "institute", "school", "academy", "polytechnic"]


def is_college_name(value):
    if DEGREE_PATTERN.search(value) or re.search(r"[\d()]", value):
        return False
    if any(word in value.lower() for word in COLLEGE_WORDS):
        return True
    return bool(re.match(r"^[A-Z]{3,6}$", value.strip()))


def find_university(line):
    for pattern in UNIVERSITY_PATTERNS:
        match = re.search(pattern, line)
        if match:
            return match.group(0).strip()
    if nlp is not None:
        for ent in nlp(line).ents:
            if ent.label_ == "ORG" and is_college_name(ent.text):
                return ent.text.strip()
    return ""


def find_year(line):
    years = re.findall(r"\b(?:19|20)\d{2}\b", line)
    if years:
        return years[-1]
    return ""


def extract_education(text):
    lines = get_section(text, "education")
    if len(lines) == 0:
        lines = []
        for line in get_lines(text):
            if len(line) <= 120 and "experience" not in line.lower():
                lines.append(line)
    result = []
    for i, line in enumerate(lines):
        degree = DEGREE_PATTERN.search(line)
        if not degree:
            continue
        college = find_university(line)
        if college == "" and i + 1 < len(lines):
            college = find_university(lines[i + 1])
        if college == "" and i > 0:
            college = find_university(lines[i - 1])
        year = find_year(line)
        if year == "" and i + 1 < len(lines):
            year = find_year(lines[i + 1])
        entry = {"degree": degree.group(0).strip(), "college": college, "year": year}
        if entry not in result:
            result.append(entry)
    return result[:4]


def education_to_text(details):
    texts = []
    for item in details:
        texts.append(", ".join([part for part in (item["degree"], item["college"]) if part]))
    return texts
