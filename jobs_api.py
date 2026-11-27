import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from database import Session, Candidate, Job, Application
from auth import require_roles
from queries import row_to_dict
from matching import score_candidate, skill_gap_report, rank_candidates
from matching.embeddings import engine_name
from jobs.jd_parser import analyze_jd

router = APIRouter()


class JobBody(BaseModel):
    title: str
    department: str = ""
    city: str = ""
    job_type: str = "Full-time"
    experience_years: int = 0
    education: str = ""
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    description: str = ""


class TextBody(BaseModel):
    text: str


class StatusBody(BaseModel):
    status: str


def job_to_dict(job, applicants=0):
    return {
        "job_id": job.job_id,
        "title": job.title,
        "department": job.department,
        "city": job.city,
        "job_type": job.job_type,
        "experience_years": job.experience_years or 0,
        "education": job.education or "",
        "required_skills": json.loads(job.required_skills or "[]"),
        "preferred_skills": json.loads(job.preferred_skills or "[]"),
        "description": job.description or "",
        "status": job.status,
        "posted_by": job.posted_by,
        "posted_by_name": job.posted_by_name,
        "applicants": applicants,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }


def count_applicants(session, job_id):
    return session.query(Application).filter(Application.job_id == job_id).count()


def get_job_or_404(session, job_id):
    job = session.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def clean_skills(items):
    result = []
    for item in items:
        item = item.strip()
        if item and item.lower() not in [r.lower() for r in result]:
            result.append(item)
    return result


def my_profile_row(session, user_id):
    return (session.query(Candidate).filter(Candidate.owner_user_id == user_id)
            .order_by(Candidate.candidate_id.desc()).first())


@router.post("/api/jobs/analyze")
def analyze(body: TextBody, user=Depends(require_roles("hr", "admin"))):
    if len(body.text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Type or paste the job description first")
    return analyze_jd(body.text)


@router.post("/api/jobs")
def create_job(body: JobBody, user=Depends(require_roles("hr", "admin"))):
    required = clean_skills(body.required_skills)
    if body.title.strip() == "":
        raise HTTPException(status_code=400, detail="Job title is required")
    if len(required) == 0:
        raise HTTPException(status_code=400, detail="Add at least one required skill")
    status = "approved" if user["role"] == "admin" else "pending"
    with Session() as session:
        job = Job(
            title=body.title.strip(), department=body.department.strip(), city=body.city.strip(),
            job_type=body.job_type, experience_years=max(body.experience_years, 0),
            education=body.education, required_skills=json.dumps(required),
            preferred_skills=json.dumps(clean_skills(body.preferred_skills)),
            description=body.description, status=status,
            posted_by=user["user_id"], posted_by_name=user["name"],
        )
        session.add(job)
        session.commit()
        return job_to_dict(job)


@router.get("/api/jobs")
def list_jobs(status: str = "", user=Depends(require_roles("hr", "admin"))):
    with Session() as session:
        query = session.query(Job)
        if user["role"] == "hr":
            query = query.filter((Job.status == "approved") | (Job.posted_by == user["user_id"]))
        if status:
            query = query.filter(Job.status == status)
        rows = query.order_by(Job.job_id.desc()).all()
        return [job_to_dict(row, count_applicants(session, row.job_id)) for row in rows]


@router.post("/api/jobs/{job_id}/approve")
def approve_job(job_id: int, user=Depends(require_roles("admin"))):
    with Session() as session:
        job = get_job_or_404(session, job_id)
        job.status = "approved"
        session.commit()
        return job_to_dict(job)


@router.post("/api/jobs/{job_id}/reject")
def reject_job(job_id: int, user=Depends(require_roles("admin"))):
    with Session() as session:
        job = get_job_or_404(session, job_id)
        job.status = "rejected"
        session.commit()
        return job_to_dict(job)


@router.delete("/api/jobs/{job_id}")
def delete_job(job_id: int, user=Depends(require_roles("hr", "admin"))):
    with Session() as session:
        job = get_job_or_404(session, job_id)
        if user["role"] != "admin" and job.posted_by != user["user_id"]:
            raise HTTPException(status_code=403, detail="You can only delete your own jobs")
        session.query(Application).filter(Application.job_id == job_id).delete()
        session.delete(job)
        session.commit()
        return {"deleted": job_id}


@router.get("/api/jobs/{job_id}/matches")
def job_matches(job_id: int, user=Depends(require_roles("hr", "admin"))):
    with Session() as session:
        job = job_to_dict(get_job_or_404(session, job_id))
        applications = {a.candidate_id: a for a in session.query(Application).filter(Application.job_id == job_id).all()}
        candidates = [row_to_dict(row) for row in session.query(Candidate).all()]
        results = []
        for item in rank_candidates(candidates, job):
            candidate = item["candidate"]
            result = item["result"]
            application = applications.get(candidate["candidate_id"])
            results.append({
                "candidate_id": candidate["candidate_id"],
                "name": candidate["name"],
                "skills": candidate["skills"],
                "experience": candidate["experience"],
                "score": result["score"],
                "semantic": result["semantic"],
                "hiring_breakdown": {"skill": result["skill_score"], "semantic": result["semantic_score"], "experience": result["experience_score"], "education": result["education_score"]},
                "recommendation": result["recommendation"],
                "matched_required": result["matched_required"],
                "missing_required": result["missing_required"],
                "application_id": application.application_id if application else None,
                "application_status": application.status if application else None,
            })
        return {"job": job, "matches": results, "engine": engine_name()}


@router.get("/api/jobs/{job_id}/skill-gap/{candidate_id}")
def one_skill_gap(job_id: int, candidate_id: int, user=Depends(require_roles("hr", "admin"))):
    with Session() as session:
        job = job_to_dict(get_job_or_404(session, job_id))
        row = session.get(Candidate, candidate_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return skill_gap_report(row_to_dict(row), job)


@router.get("/api/jobs/{job_id}/skill-gaps")
def all_skill_gaps(job_id: int, user=Depends(require_roles("hr", "admin"))):
    with Session() as session:
        job = job_to_dict(get_job_or_404(session, job_id))
        reports = [skill_gap_report(row_to_dict(row), job) for row in session.query(Candidate).all()]
        reports.sort(key=lambda r: r["score"], reverse=True)
        return reports


@router.post("/api/applications/{application_id}/status")
def set_application_status(application_id: int, body: StatusBody, user=Depends(require_roles("hr", "admin"))):
    if body.status not in ("applied", "shortlisted", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status")
    with Session() as session:
        application = session.get(Application, application_id)
        if application is None:
            raise HTTPException(status_code=404, detail="Application not found")
        application.status = body.status
        session.commit()
        return {"application_id": application_id, "status": body.status}


@router.get("/api/my/profile")
def my_profile(user=Depends(require_roles("candidate"))):
    with Session() as session:
        row = my_profile_row(session, user["user_id"])
        return row_to_dict(row) if row else None


@router.get("/api/jobs/open")
def open_jobs(user=Depends(require_roles("candidate"))):
    with Session() as session:
        row = my_profile_row(session, user["user_id"])
        candidate = row_to_dict(row) if row else None
        applied = {a.job_id for a in session.query(Application).filter(Application.user_id == user["user_id"]).all()}
        jobs = []
        for job in session.query(Job).filter(Job.status == "approved").order_by(Job.job_id.desc()).all():
            data = job_to_dict(job)
            data["applied"] = job.job_id in applied
            if candidate:
                result = score_candidate(candidate, data)
                data["my_score"] = result["score"]
                data["missing_required"] = result["missing_required"]
            jobs.append(data)
        return {"has_profile": candidate is not None, "jobs": jobs}


@router.post("/api/jobs/{job_id}/apply")
def apply(job_id: int, user=Depends(require_roles("candidate"))):
    with Session() as session:
        job = get_job_or_404(session, job_id)
        if job.status != "approved":
            raise HTTPException(status_code=400, detail="This job is not open")
        row = my_profile_row(session, user["user_id"])
        if row is None:
            raise HTTPException(status_code=400, detail="Add your resume first, then apply")
        exists = (session.query(Application)
                  .filter(Application.job_id == job_id, Application.user_id == user["user_id"]).first())
        if exists:
            raise HTTPException(status_code=409, detail="You already applied for this job")
        result = score_candidate(row_to_dict(row), job_to_dict(job))
        application = Application(job_id=job_id, candidate_id=row.candidate_id, user_id=user["user_id"],
                                  status="applied", match_score=result["score"])
        session.add(application)
        session.commit()
        return {"application_id": application.application_id, "match_score": result["score"]}


@router.get("/api/my/applications")
def my_applications(user=Depends(require_roles("candidate"))):
    with Session() as session:
        rows = (session.query(Application).filter(Application.user_id == user["user_id"])
                .order_by(Application.application_id.desc()).all())
        result = []
        for application in rows:
            job = session.get(Job, application.job_id)
            result.append({
                "application_id": application.application_id,
                "job_title": job.title if job else "(job removed)",
                "city": job.city if job else "",
                "status": application.status,
                "match_score": application.match_score,
                "created_at": application.created_at.isoformat() if application.created_at else None,
            })
        return result
