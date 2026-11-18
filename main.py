import os
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from parser.resume_parser import parse_resume, parse_text, calculate_accuracy, build_final_json
from database import save_candidate
from queries import get_all_candidates, get_stats, delete_candidate, get_final_profile
from auth import (register_user, authenticate, seed_admin, list_users, set_user_status,
                  current_user, require_roles)
from emailer import send_approval_email, send_rejection_email

app = FastAPI(title="AI Recruitment Copilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
seed_admin()


class LoginBody(BaseModel):
    email: str
    password: str
    role: str


class RegisterBody(BaseModel):
    name: str
    email: str
    password: str
    role: str


class TextBody(BaseModel):
    text: str


@app.get("/")
def home():
    return {"message": "AI Recruitment Copilot is running"}


@app.post("/api/register")
def register(body: RegisterBody):
    try:
        user = register_user(body.name, body.email, body.password, body.role)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    return {
        "message": "Account created. Please wait for the admin to approve it. We will email you when it is approved.",
        "user": user,
    }


@app.post("/api/login")
def login(body: LoginBody):
    try:
        result = authenticate(body.email, body.password, body.role)
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))
    if result is None:
        raise HTTPException(status_code=401, detail="Wrong email, password or portal")
    user, token = result
    return {"token": token, "user": user}


@app.get("/api/me")
def me(user=Depends(current_user)):
    return user


@app.get("/api/admin/users")
def admin_users(status: str = "pending", user=Depends(require_roles("admin"))):
    return list_users(status)


@app.post("/api/admin/users/{user_id}/approve")
def approve_user(user_id: int, user=Depends(require_roles("admin"))):
    approved = set_user_status(user_id, "approved")
    if approved is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": approved, "email": send_approval_email(approved)}


@app.post("/api/admin/users/{user_id}/reject")
def reject_user(user_id: int, user=Depends(require_roles("admin"))):
    rejected = set_user_status(user_id, "rejected")
    if rejected is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": rejected, "email": send_rejection_email(rejected)}


@app.post("/api/upload_resume")
async def upload_resume(file: UploadFile = File(...), user=Depends(require_roles("recruiter", "candidate"))):
    if not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")

    save_name = uuid.uuid4().hex[:8] + "_" + os.path.basename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER, save_name)
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        profile = parse_resume(save_path)
    except Exception:
        raise HTTPException(status_code=422, detail="Could not read this file")

    accuracy = calculate_accuracy(profile)
    candidate_id = save_candidate(profile, save_path)

    return {
        "candidate_id": candidate_id,
        "filename": file.filename,
        "profile": profile,
        "candidate_profile": build_final_json(profile, candidate_id),
        "extraction_accuracy": accuracy,
    }


@app.post("/api/parse_text")
def parse_typed_details(body: TextBody, user=Depends(require_roles("recruiter", "candidate"))):
    if len(body.text.strip()) < 30:
        raise HTTPException(status_code=400, detail="Please type at least a few lines of resume details")

    profile = parse_text(body.text)
    accuracy = calculate_accuracy(profile)
    candidate_id = save_candidate(profile, "typed details")

    return {
        "candidate_id": candidate_id,
        "filename": "Typed details",
        "profile": profile,
        "candidate_profile": build_final_json(profile, candidate_id),
        "extraction_accuracy": accuracy,
    }


@app.get("/api/candidates")
def candidates(user=Depends(require_roles("recruiter", "hr"))):
    return get_all_candidates()


@app.get("/api/candidates/{candidate_id}/profile")
def candidate_profile(candidate_id: int, user=Depends(require_roles("recruiter", "hr"))):
    profile = get_final_profile(candidate_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return profile


@app.get("/api/stats")
def stats(user=Depends(require_roles("recruiter", "hr"))):
    return get_stats()


@app.delete("/api/candidates/{candidate_id}")
def remove_candidate(candidate_id: int, user=Depends(require_roles("recruiter"))):
    if not delete_candidate(candidate_id):
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"deleted": candidate_id}
