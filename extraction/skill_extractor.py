import csv
import os
import re

try:
    from rapidfuzz import fuzz, process
except Exception:
    fuzz = None
    process = None

from extraction.section_extractor import get_lines, get_section

SKILLS_FILE = os.path.join(os.path.dirname(__file__), "..", "skills", "skills.csv")
CASE_SENSITIVE = ["Excel", "Spark", "Swift", "Ruby", "Rust", "Dart", "Julia", "Oracle", "Unity", "Sketch"]
TOKEN_ONLY = ["R", "C", "Go"]


def normalize(value):
    value = value.lower()
    value = value.replace("c++", "cpp").replace("c#", "csharp").replace(".net", "dotnet")
    return re.sub(r"[^a-z0-9]", "", value)


def load_skills():
    entries = []
    with open(SKILLS_FILE, newline="") as f:
        for row in csv.DictReader(f):
            skill = row["skill"].strip()
            names = [skill]
            if row["aliases"]:
                names = names + [a.strip() for a in row["aliases"].split("|") if a.strip()]
            entries.append((skill, names))
    return entries


ENTRIES = load_skills()
NORMAL_KEYS = {}
for skill, names in ENTRIES:
    for name in names:
        key = normalize(name)
        if len(key) >= 5 and skill not in TOKEN_ONLY and skill not in CASE_SENSITIVE:
            NORMAL_KEYS[key] = skill
KEY_LIST = list(NORMAL_KEYS.keys())


def exact_pattern(name):
    short = len(name) <= 3 or name in CASE_SENSITIVE
    if short:
        body = "(?:" + re.escape(name) + "|" + re.escape(name.upper()) + ")"
        flags = 0
    else:
        body = re.escape(name)
        flags = re.IGNORECASE
    return re.compile(r"(?<![A-Za-z0-9+#])" + body + r"(?![A-Za-z0-9+#])", flags)


PATTERNS = []
for skill, names in ENTRIES:
    if skill in TOKEN_ONLY:
        continue
    for name in names:
        PATTERNS.append((skill, exact_pattern(name)))


def canonical_skill(name):
    key = normalize(name)
    if key in NORMAL_KEYS:
        return NORMAL_KEYS[key]
    return ""


def split_items(lines):
    items = []
    for line in lines:
        for part in re.split(r"[,;|\u2022/:]|\s{2,}", line):
            part = part.strip()
            if part:
                items.append(part)
    return items


def spaced_matches(text):
    found = []
    for line in get_lines(text):
        tokens = re.findall(r"[A-Za-z0-9+#\.\-]+", line)
        for size in (1, 2, 3):
            for i in range(len(tokens) - size + 1):
                key = normalize("".join(tokens[i:i + size]))
                if key in NORMAL_KEYS:
                    found.append(NORMAL_KEYS[key])
    return found


def extract_skills(text):
    found = []
    for skill, pattern in PATTERNS:
        if skill not in found and pattern.search(text):
            found.append(skill)
    for skill in spaced_matches(text):
        if skill not in found:
            found.append(skill)

    items = split_items(get_section(text, "skills"))
    for item in items:
        if item in TOKEN_ONLY and item not in found:
            found.append(item)
    if process is not None:
        for item in items:
            key = normalize(item)
            if len(key) < 5 or len(item) > 30 or key in NORMAL_KEYS:
                continue
            best = process.extractOne(key, KEY_LIST, scorer=fuzz.ratio, score_cutoff=90)
            if best and NORMAL_KEYS[best[0]] not in found:
                found.append(NORMAL_KEYS[best[0]])
    return found
