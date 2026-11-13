import re
from datetime import datetime
import pdfplumber
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph

SKILLS = [
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "PHP", "Ruby", "Kotlin", "Swift",
    "HTML", "CSS", "React", "Angular", "Vue", "Node.js", "Express.js", "Django", "Flask", "FastAPI",
    "Spring Boot", "REST API", "GraphQL", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Oracle",
    "NoSQL", "Redis", "SQLite", "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "Data Analysis", "Data Visualization", "Statistics", "TensorFlow", "PyTorch", "Keras",
    "Scikit-learn", "Pandas", "NumPy", "Matplotlib", "Seaborn", "OpenCV", "Hadoop", "Spark",
    "Kafka", "Airflow", "Tableau", "Power BI", "Excel", "SAS", "SPSS", "MLOps", "Docker",
    "Kubernetes", "Jenkins", "Terraform", "Linux", "Git", "GitHub", "AWS", "Azure", "GCP",
    "Selenium", "Postman", "Jira", "Agile", "Scrum", "Project Management", "Salesforce", "SAP",
    "QuickBooks", "Tally", "Photoshop", "Figma", "SEO", "Google Analytics", "R", "Go",
]

ALIASES = {
    "sklearn": "Scikit-learn", "scikit learn": "Scikit-learn", "microsoft excel": "Excel",
    "ms excel": "Excel", "node": "Node.js", "nodejs": "Node.js", "postgres": "PostgreSQL",
    "powerbi": "Power BI", "natural language processing": "NLP", "reactjs": "React",
    "amazon web services": "AWS", "google cloud": "GCP",
}

CASE_SENSITIVE = ["Excel", "Spark", "R", "Go", "Express.js", "Vue", "Swift", "Ruby", "Oracle"]

SECTIONS = {
    "education": ["education", "academic background", "academics", "qualifications",
                  "educational qualification", "education and training"],
    "skills": ["skills", "technical skills", "core skills", "key skills", "skills summary",
               "technical proficiency"],
    "experience": ["experience", "work experience", "professional experience",
                   "employment history", "work history", "professional background",
                   "internship experience", "internships"],
    "projects": ["projects", "academic projects", "personal projects", "key projects"],
    "certifications": ["certifications", "certificates", "licenses and certifications",
                       "courses and certifications"],
}

OTHER_HEADINGS = ["summary", "professional summary", "profile", "objective", "career objective",
                  "achievements", "interests", "languages", "references", "hobbies",
                  "declaration", "contact", "personal details", "highlights"]

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


def read_pdf(path):
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text = text + page_text + "\n"
    return text


def read_docx(path):
    doc = Document(path)
    text = ""
    for child in doc.element.body.iterchildren():
        if child.tag.endswith("}p"):
            text = text + Paragraph(child, doc).text + "\n"
        elif child.tag.endswith("}tbl"):
            table = Table(child, doc)
            for row in table.rows:
                seen = []
                for cell in row.cells:
                    if cell.text not in seen:
                        seen.append(cell.text)
                        text = text + cell.text + "\n"
    return text


def extract_resume_text(path):
    if path.lower().endswith(".pdf"):
        return read_pdf(path)
    elif path.lower().endswith(".docx"):
        return read_docx(path)
    else:
        raise ValueError("Only PDF and DOCX files are supported")


def get_lines(text):
    lines = []
    for line in text.split("\n"):
        line = line.strip()
        if line != "":
            lines.append(line)
    return lines


def all_headings():
    headings = list(OTHER_HEADINGS)
    for names in SECTIONS.values():
        headings = headings + names
    return headings


def get_section(text, section_name):
    names = SECTIONS[section_name]
    headings = all_headings()
    result = []
    inside = False
    for line in get_lines(text):
        clean = line.rstrip(":").strip().lower()
        if clean in names:
            inside = True
            continue
        if clean in headings:
            inside = False
            continue
        if inside:
            result.append(line)
    return result


def get_email(text):
    emails = re.findall(r"[\w\.\-+]+@[\w\-]+(?:\.[\w\-]+)+", text)
    if len(emails) > 0:
        return emails[0]
    return ""


def get_phone(text):
    patterns = [
        r"(?<![\d])(?:\+?91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}(?![\d])",
        r"(?<![\d])(?:\+?1[\s\-]?)?\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}(?![\d])",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0).strip()
    return ""


def get_name(text):
    match = re.search(r"^\s*name\s*[:\-]\s*([A-Za-z\.\' ]+)$", text, re.IGNORECASE | re.MULTILINE)
    if match:
        return match.group(1).strip().title()
    for line in get_lines(text)[:6]:
        if "@" in line or any(ch.isdigit() for ch in line):
            continue
        if line.rstrip(":").strip().lower() in all_headings():
            continue
        words = line.split()
        if not 2 <= len(words) <= 4:
            continue
        if not all(re.match(r"^[A-Za-z][A-Za-z\.\-']*$", w) for w in words):
            continue
        if any(w.lower().strip(".") in TITLE_WORDS for w in words):
            continue
        return line.title()
    return ""


def clean_skill_name(name):
    key = name.lower()
    if key in ALIASES:
        return ALIASES[key]
    return name


def get_skills(text):
    found = []
    for skill in SKILLS:
        if skill in CASE_SENSITIVE:
            pattern = r"(?<![A-Za-z0-9+#])(?:" + re.escape(skill) + "|" + re.escape(skill.upper()) + r")(?![A-Za-z0-9+#])"
            flags = 0
        else:
            pattern = r"(?<![A-Za-z0-9+#])" + re.escape(skill) + r"(?![A-Za-z0-9+#])"
            flags = re.IGNORECASE
        if re.search(pattern, text, flags):
            found.append(skill)
    for alias, skill in ALIASES.items():
        pattern = r"(?<![A-Za-z0-9+#])" + re.escape(alias) + r"(?![A-Za-z0-9+#])"
        if re.search(pattern, text, re.IGNORECASE) and skill not in found:
            found.append(skill)
    return found


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


def get_experience(text):
    patterns = [
        r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:[A-Za-z]+\s+){0,3}experience",
        r"experience\s*(?:of|:)\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            number = int(float(match.group(1)))
            if number == 1:
                return "1 year"
            return str(number) + " years"

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
    return format_experience(total)


def find_university(line):
    for pattern in UNIVERSITY_PATTERNS:
        match = re.search(pattern, line)
        if match:
            return match.group(0).strip()
    return ""


def get_education(text):
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
        university = find_university(line)
        if university == "" and i + 1 < len(lines):
            university = find_university(lines[i + 1])
        if university == "" and i > 0:
            university = find_university(lines[i - 1])
        entry = degree.group(0).strip()
        if university != "":
            entry = entry + ", " + university
        if entry not in result:
            result.append(entry)
    return result[:4]


def get_location(text):
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
    return ""


def get_projects(text):
    lines = get_section(text, "projects")
    return [line.lstrip("-\u2022* ") for line in lines][:6]


def get_certifications(text):
    lines = get_section(text, "certifications")
    return [line.lstrip("-\u2022* ") for line in lines][:6]


def parse_resume(path):
    text = extract_resume_text(path)
    return {
        "name": get_name(text),
        "email": get_email(text),
        "phone": get_phone(text),
        "location": get_location(text),
        "education": get_education(text),
        "experience": get_experience(text),
        "skills": get_skills(text),
        "projects": get_projects(text),
        "certifications": get_certifications(text),
    }


def calculate_accuracy(profile):
    fields = ["name", "email", "phone", "education", "experience", "skills"]
    filled = 0
    for field in fields:
        if profile[field]:
            filled = filled + 1
    return round(filled / len(fields) * 100, 2)
