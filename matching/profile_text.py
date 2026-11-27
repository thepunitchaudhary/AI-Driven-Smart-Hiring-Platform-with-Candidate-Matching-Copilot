def profile_to_text(candidate):
    return (
        "Skills: " + " ".join(candidate["skills"]) + "\n"
        "Education: " + " ".join(candidate["education"]) + "\n"
        "Projects: " + " ".join(candidate.get("projects", [])) + "\n"
        "Experience: " + str(candidate.get("experience") or "0 years")
    )


def jd_to_text(job):
    return (
        "Job: " + job["title"] + "\n"
        "Required Skills: " + " ".join(job["required_skills"]) + "\n"
        "Preferred Skills: " + " ".join(job["preferred_skills"]) + "\n"
        "Education: " + (job["education"] or "") + "\n"
        "Experience: " + str(job["experience_years"]) + " years"
    )
