from extraction.skill_extractor import canonical_skill
from extraction.experience_extractor import format_experience


def clean_list(items):
    cleaned = []
    for item in items:
        item = item.strip().lstrip("-\u2022* ")
        if item and item not in cleaned:
            cleaned.append(item)
    return cleaned


def profile_from_form(form):
    skills = []
    for skill in clean_list(form["skills"].replace("\n", ",").split(",")):
        name = canonical_skill(skill) or skill
        if name not in skills:
            skills.append(name)

    details = []
    if form["degree"].strip() or form["college"].strip():
        details.append({"degree": form["degree"].strip(), "college": form["college"].strip(),
                        "year": form["year"].strip()})

    years = form["experience_years"]
    years_text = int(years) if float(years) == int(years) else float(years)
    location = form["city"].strip()

    return {
        "name": form["name"].strip(),
        "email": form["email"].strip(),
        "phone": form["phone"].strip(),
        "location": location,
        "education": [", ".join([p for p in (d["degree"], d["college"]) if p]) for d in details],
        "education_details": details,
        "experience": format_experience(int(round(float(years) * 12))),
        "experience_years": years_text,
        "skills": skills,
        "projects": clean_list(form["projects"].split("\n")),
        "certifications": clean_list(form["certifications"].split("\n")),
    }
