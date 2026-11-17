import json
from database import Session, Candidate
from extraction.experience_extractor import years_from_text


def has_value(value):
    return value not in (None, "", "[]")


def accuracy_of(row):
    fields = [row.name, row.email, row.phone, row.education, row.experience, row.skills]
    filled = 0
    for field in fields:
        if has_value(field):
            filled = filled + 1
    return round(filled / len(fields) * 100)


def load_education(row):
    details = []
    for item in json.loads(row.education or "[]"):
        if isinstance(item, dict):
            details.append(item)
        else:
            parts = item.split(", ", 1)
            details.append({"degree": parts[0], "college": parts[1] if len(parts) > 1 else "", "year": ""})
    return details


def row_to_dict(row):
    details = load_education(row)
    return {
        "candidate_id": row.candidate_id,
        "name": row.name,
        "email": row.email,
        "phone": row.phone,
        "location": row.location,
        "experience": row.experience,
        "education": [", ".join([p for p in (d["degree"], d["college"]) if p]) for d in details],
        "education_details": details,
        "skills": json.loads(row.skills or "[]"),
        "projects": json.loads(row.projects or "[]"),
        "certifications": json.loads(row.certifications or "[]"),
        "accuracy": accuracy_of(row),
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def get_final_profile(candidate_id):
    with Session() as session:
        row = session.get(Candidate, candidate_id)
        if row is None:
            return None
        return {
            "candidate_id": "C%03d" % row.candidate_id,
            "name": row.name,
            "email": row.email,
            "phone": row.phone,
            "location": row.location,
            "skills": json.loads(row.skills or "[]"),
            "education": load_education(row),
            "experience_years": years_from_text(row.experience),
            "projects": json.loads(row.projects or "[]"),
            "certifications": json.loads(row.certifications or "[]"),
        }


def get_all_candidates():
    with Session() as session:
        rows = session.query(Candidate).order_by(Candidate.created_at.desc()).all()
        return [row_to_dict(row) for row in rows]


def get_stats():
    with Session() as session:
        rows = session.query(Candidate).all()
        total = len(rows)
        accuracies = [accuracy_of(row) for row in rows]
        all_skills = set()
        for row in rows:
            all_skills.update(json.loads(row.skills or "[]"))
        average = round(sum(accuracies) / total) if total > 0 else 0
        complete = len([a for a in accuracies if a == 100])
        return {
            "total": total,
            "average_accuracy": average,
            "complete_profiles": complete,
            "unique_skills": len(all_skills),
        }


def delete_candidate(candidate_id):
    with Session() as session:
        row = session.get(Candidate, candidate_id)
        if row is None:
            return False
        session.delete(row)
        session.commit()
        return True
