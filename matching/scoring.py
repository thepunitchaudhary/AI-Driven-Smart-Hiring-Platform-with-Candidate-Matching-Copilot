from extraction.experience_extractor import years_from_text
from matching.embeddings import text_similarity
from matching.profile_text import profile_to_text, jd_to_text

PREFERRED_DEGREES = ["B.Tech", "B.E", "M.Tech", "M.E", "MCA", "PhD"]


def education_level(text):
    t = (text or "").lower()
    if "phd" in t or "ph.d" in t or "doctor" in t:
        return 4
    for word in ["master", "m.tech", "mtech", "mca", "mba", "m.sc", "msc", "m.e", "m.com", "mcom"]:
        if word in t:
            return 3
    for word in ["bachelor", "b.tech", "btech", "bca", "b.sc", "bsc", "b.e", "b.com", "bcom"]:
        if word in t:
            return 2
    if "diploma" in t:
        return 1
    return 0


def candidate_years(candidate):
    return years_from_text(candidate.get("experience"))


def recommendation(score):
    if score >= 80:
        return "Highly recommend"
    if score >= 65:
        return "Recommend"
    if score >= 50:
        return "Consider"
    return "Not recommended"


def skill_score(candidate_skills, required_skills, preferred_skills=None):
    preferred_skills = preferred_skills or []
    have = {s.lower() for s in candidate_skills}
    total = 2 * len(required_skills) + len(preferred_skills)
    if total == 0:
        return 0
    matched = 2 * len([s for s in required_skills if s.lower() in have])
    matched = matched + len([s for s in preferred_skills if s.lower() in have])
    return matched / total * 100


def experience_score(candidate_exp, required_exp):
    if required_exp <= 0 or candidate_exp >= required_exp:
        return 100
    return candidate_exp / required_exp * 100


def education_score(candidate_education, required_education=""):
    need = education_level(required_education)
    have = max([education_level(e) for e in candidate_education] or [0])
    if need > 0:
        return 100 if have >= need else 50
    for education in candidate_education:
        if any(degree.lower() in education.lower() for degree in PREFERRED_DEGREES):
            return 100
    return 50


def hiring_score(skill, semantic, experience, education):
    final_score = skill * 0.40 + semantic * 0.30 + experience * 0.20 + education * 0.10
    return round(final_score, 2)


def score_candidate(candidate, job):
    have = {s.lower() for s in candidate["skills"]}
    required = job["required_skills"]
    preferred = job["preferred_skills"]

    matched_required = [s for s in required if s.lower() in have]
    missing_required = [s for s in required if s.lower() not in have]
    matched_preferred = [s for s in preferred if s.lower() in have]
    missing_preferred = [s for s in preferred if s.lower() not in have]

    years = candidate_years(candidate)
    need_years = job["experience_years"] or 0
    skill = skill_score(candidate["skills"], required, preferred)
    semantic = round(text_similarity(profile_to_text(candidate), jd_to_text(job)) * 100, 2)
    experience = experience_score(years, need_years)
    education = education_score(candidate["education"], job["education"])
    final = hiring_score(skill, semantic, experience, education)
    score = round(final)

    return {
        "score": score,
        "hiring_score": final,
        "skill_score": round(skill, 2),
        "semantic": round(semantic),
        "semantic_score": semantic,
        "experience_score": round(experience, 2),
        "education_score": education,
        "recommendation": recommendation(score),
        "matched_required": matched_required,
        "missing_required": missing_required,
        "matched_preferred": matched_preferred,
        "missing_preferred": missing_preferred,
        "years": years,
        "experience_ok": years >= need_years,
        "education_ok": education == 100,
    }
