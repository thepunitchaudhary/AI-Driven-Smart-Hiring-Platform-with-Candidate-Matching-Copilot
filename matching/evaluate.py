"""Milestone 2 document, Steps 13 and 14: evaluate one candidate, then rank all of them.

These functions take the simple input format used in the document
(candidate["experience_years"], job["skills"]) and use the same scoring engine
as the web app, so the numbers are identical to what the app shows."""
from matching.scoring import score_candidate
from matching.skill_gap import generate_skill_gap, learning_path


def _candidate(candidate):
    years = candidate.get("experience_years", 0)
    return {
        "candidate_id": candidate.get("candidate_id"),
        "name": candidate.get("name", ""),
        "skills": candidate.get("skills", []),
        "education": candidate.get("education", []),
        "projects": candidate.get("projects", []),
        "certifications": candidate.get("certifications", []),
        "experience": candidate.get("experience") or str(years) + " years",
    }


def _job(job):
    return {
        "title": job.get("title", "Job"),
        "required_skills": job.get("required_skills") or job.get("skills", []),
        "preferred_skills": job.get("preferred_skills", []),
        "education": job.get("education", ""),
        "experience_years": job.get("experience_years", 0),
    }


def evaluate_candidate(candidate, job):
    c, j = _candidate(candidate), _job(job)
    result = score_candidate(c, j)
    gap = generate_skill_gap(c["skills"], j["required_skills"] + j["preferred_skills"])
    return {
        "candidate": c["name"],
        "matching_score": result["hiring_score"],
        "semantic_score": result["semantic_score"],
        "skill_score": result["skill_score"],
        "Missing Skills": gap,
        "Learning Path": learning_path(gap),
    }


def rank_candidates(candidates, job):
    results = [evaluate_candidate(c, job) for c in candidates]
    results.sort(key=lambda r: r["matching_score"], reverse=True)
    return results
