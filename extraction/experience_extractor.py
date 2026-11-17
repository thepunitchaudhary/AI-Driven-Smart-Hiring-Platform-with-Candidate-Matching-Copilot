import re
from datetime import datetime
from extraction.section_extractor import get_lines, get_section
from extraction.education_extractor import DEGREE_PATTERN

MONTHS = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6, "jul": 7,
          "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12}
MONTH_WORDS = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec"
DASH = r"\s*(?:-|\u2013|\u2014|to)\s*"
NOW_WORDS = r"Present|Current|Now|Ongoing"

RANGE_MONTH_YEAR = re.compile(
    r"(" + MONTH_WORDS + r")[a-z]*\.?,?\s+(\d{4})" + DASH +
    r"(?:(" + NOW_WORDS + r")|(" + MONTH_WORDS + r")[a-z]*\.?,?\s+(\d{4}))", re.IGNORECASE)
RANGE_SLASH = re.compile(
    r"\b(\d{1,2})/(\d{4})" + DASH + r"(?:(" + NOW_WORDS + r")|(\d{1,2})/(\d{4}))", re.IGNORECASE)
RANGE_YEAR = re.compile(
    r"\b((?:19|20)\d{2})" + DASH + r"(?:(" + NOW_WORDS + r")|((?:19|20)\d{2}))\b", re.IGNORECASE)


def month_diff(start_year, start_month, end_year, end_month):
    return (end_year - start_year) * 12 + (end_month - start_month)


def months_in_line(line):
    now = datetime.now()
    match = RANGE_MONTH_YEAR.search(line)
    if match:
        start_month = MONTHS[match.group(1)[:3].lower()]
        start_year = int(match.group(2))
        if match.group(3):
            return month_diff(start_year, start_month, now.year, now.month)
        end_month = MONTHS[match.group(4)[:3].lower()]
        return month_diff(start_year, start_month, int(match.group(5)), end_month)
    match = RANGE_SLASH.search(line)
    if match:
        start_month = int(match.group(1))
        start_year = int(match.group(2))
        if match.group(3):
            return month_diff(start_year, start_month, now.year, now.month)
        return month_diff(start_year, start_month, int(match.group(5)), int(match.group(4)))
    match = RANGE_YEAR.search(line)
    if match:
        start_year = int(match.group(1))
        if match.group(2):
            return (now.year - start_year) * 12
        return (int(match.group(3)) - start_year) * 12
    return 0


def format_experience(months):
    if months <= 0:
        return ""
    if months < 12:
        return str(months) + " months"
    years = round(months / 12)
    if years == 1:
        return "1 year"
    return str(years) + " years"


def years_number(months):
    if months <= 0:
        return 0
    years = round(months / 12, 1)
    if years == int(years):
        return int(years)
    return years


def years_from_text(experience):
    match = re.match(r"(\d+(?:\.\d+)?)\s*(year|month)", experience or "")
    if not match:
        return 0
    value = float(match.group(1))
    if match.group(2) == "month":
        value = round(value / 12, 1)
    if value == int(value):
        return int(value)
    return value


def extract_experience(text):
    patterns = [
        r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:[A-Za-z]+\s+){0,3}experience",
        r"experience\s*(?:of|:)\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            number = int(float(match.group(1)))
            months = number * 12
            return format_experience(months), number

    lines = get_section(text, "experience")
    if len(lines) == 0:
        education = get_section(text, "education")
        lines = []
        for line in get_lines(text):
            if line not in education and not DEGREE_PATTERN.search(line):
                lines.append(line)
    total = 0
    for line in lines:
        total = total + max(months_in_line(line), 0)
    return format_experience(total), years_number(total)
