from matching.scoring import score_candidate, candidate_years

LEVEL_NAMES = {0: "None", 1: "Basic", 2: "Intermediate", 3: "Advanced"}
LEVEL_PERCENT = {0: 0, 1: 33, 2: 66, 3: 100}

COURSES = {
    "AWS": "AWS Certified Cloud Practitioner",
    "Azure": "Microsoft Azure Fundamentals (AZ-900)",
    "GCP": "Google Cloud Digital Leader",
    "Kubernetes": "Certified Kubernetes Application Developer (CKAD) preparation",
    "Docker": "Docker fundamentals and containerizing a small app",
    "TensorFlow": "TensorFlow Developer course with a small project",
    "PyTorch": "PyTorch basics and a small model project",
    "MLOps": "MLOps fundamentals: model deployment and monitoring",
    "SQL": "SQL for data analysis, with practice queries",
    "Python": "Python programming fundamentals",
    "React": "React fundamentals with a small web app",
    "Machine Learning": "Machine Learning specialization",
}


def skill_level(candidate, skill):
    name = skill.lower()
    if name not in {s.lower() for s in candidate["skills"]}:
        return 0
    text = " ".join(candidate.get("projects", []) + candidate.get("certifications", [])).lower()
    in_work = name in text
    years = candidate_years(candidate)
    if in_work and years >= 3:
        return 3
    if in_work or years >= 1:
        return 2
    return 1


def course_for(skill):
    return COURSES.get(skill, "Beginner course in " + skill + " and one small project")


def skill_gap_report(candidate, job):
    result = score_candidate(candidate, job)
    rows = []
    for skill in job["required_skills"]:
        level = skill_level(candidate, skill)
        rows.append({"skill": skill, "level": LEVEL_NAMES[level], "percent": LEVEL_PERCENT[level], "type": "Required"})
    for skill in job["preferred_skills"]:
        level = skill_level(candidate, skill)
        rows.append({"skill": skill, "level": LEVEL_NAMES[level], "percent": LEVEL_PERCENT[level], "type": "Preferred"})

    missing = result["missing_required"] + result["missing_preferred"]
    weeks = 2 * len(result["missing_required"]) + len(result["missing_preferred"])
    name = (candidate["name"] or "").strip()
    first = name.split(" ")[0] if name else "The candidate"
    total = len(job["required_skills"])

    summary = first + " matches " + str(len(result["matched_required"])) + " of " + str(total) + " required skills."
    if result["matched_required"]:
        summary = summary + " Strong in " + ", ".join(result["matched_required"][:3]) + "."
    if result["missing_required"]:
        summary = summary + " Needs development in " + ", ".join(result["missing_required"][:4]) + "."
    else:
        summary = summary + " Meets all the required skills for this role."
    if not result["experience_ok"]:
        summary = summary + " Experience is " + str(result["years"]) + " years against " + str(job["experience_years"]) + " needed."
    if weeks > 0:
        summary = summary + " Estimated learning time: " + str(weeks) + " weeks."

    return {
        "candidate_id": candidate["candidate_id"],
        "candidate": candidate["name"],
        "score": result["score"],
        "recommendation": result["recommendation"],
        "skills": rows,
        "missing_skills": missing,
        "recommended_courses": [course_for(s) for s in missing[:5]],
        "estimated_weeks": weeks,
        "summary": summary,
    }


# ---- Milestone 2 document, Steps 11 and 12 (same names as the document) ----
def generate_skill_gap(candidate_skills, jd_skills):
    """Step 11: the job skills the candidate does not have."""
    have = {s.lower() for s in candidate_skills}
    return [s for s in jd_skills if s.lower() not in have]


def learning_path(missing_skills):
    """Step 12: one learning recommendation per missing skill.
    skill_gap_report() gives the fuller version, with a course and a level per skill."""
    return {skill: "Learn " + skill for skill in missing_skills}
