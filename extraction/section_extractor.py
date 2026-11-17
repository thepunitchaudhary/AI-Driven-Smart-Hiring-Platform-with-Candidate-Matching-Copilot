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

ALL_HEADINGS = list(OTHER_HEADINGS)
for names in SECTIONS.values():
    ALL_HEADINGS = ALL_HEADINGS + names


def get_lines(text):
    lines = []
    for line in text.split("\n"):
        line = line.strip()
        if line != "":
            lines.append(line)
    return lines


def is_heading(line):
    return line.rstrip(":").strip().lower() in ALL_HEADINGS


def get_section(text, section_name):
    names = SECTIONS[section_name]
    result = []
    inside = False
    for line in get_lines(text):
        clean = line.rstrip(":").strip().lower()
        if clean in names:
            inside = True
            continue
        if clean in ALL_HEADINGS:
            inside = False
            continue
        if inside:
            result.append(line)
    return result


def get_header_lines(text):
    header = []
    for line in get_lines(text):
        if is_heading(line):
            break
        header.append(line)
    return header[:8]


def get_projects(text):
    lines = get_section(text, "projects")
    return [line.lstrip("-\u2022* ") for line in lines][:6]


def get_certifications(text):
    lines = get_section(text, "certifications")
    return [line.lstrip("-\u2022* ") for line in lines][:6]
