import os
import shutil
import threading
import time
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from parser.resume_parser import parse_resume, parse_text, calculate_accuracy, build_final_json
from parser.form_profile import profile_from_form
from database import save_candidate, find_by_email, Session, Candidate, describe_db
from queries import get_all_candidates, get_stats, delete_candidate, get_final_profile
from auth import (User, register_user, authenticate, seed_admin, list_users, set_user_status,
                  create_reset_token, reset_password, current_user, require_roles)
from emailer import send_approval_email, send_rejection_email, send_reset_email
from jobs_api import router as jobs_router
from matching.embeddings import get_model

# Deployment settings (all optional; the defaults suit local development).
FRONTEND_ORIGINS = [o.strip() for o in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "10"))

# Simple in-memory limit on repeated sign-in / reset requests (per address and email).
ATTEMPT_LIMIT = 8
ATTEMPT_WINDOW = 15 * 60
_attempts = {}


def rate_limited(key):
    now = time.time()
    _attempts[key] = [t for t in _attempts.get(key, []) if now - t < ATTEMPT_WINDOW]
    return len(_attempts[key]) >= ATTEMPT_LIMIT


def note_attempt(key):
    _attempts.setdefault(key, []).append(time.time())


def client_key(request, extra=""):
    return (request.client.host if request.client else "?") + "|" + extra.strip().lower()

app = FastAPI(title="AI Recruitment Copilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
seed_admin()
app.include_router(jobs_router)
threading.Thread(target=get_model, daemon=True).start()


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


class ForgotBody(BaseModel):
    email: str


class ResetBody(BaseModel):
    token: str
    password: str


class FormBody(BaseModel):
    name: str
    email: str
    phone: str = ""
    city: str = ""
    experience_years: float = 0
    degree: str = ""
    college: str = ""
    year: str = ""
    skills: str = ""
    projects: str = ""
    certifications: str = ""


def owner_for(user):
    return user["user_id"] if user["role"] == "candidate" else None


def saved_response(profile, path, filename, user):
    candidate_id = save_candidate(profile, path, owner_for(user))
    other = find_by_email(profile["email"], candidate_id)
    return {
        "candidate_id": candidate_id,
        "filename": filename,
        "profile": profile,
        "candidate_profile": build_final_json(profile, candidate_id),
        "extraction_accuracy": calculate_accuracy(profile),
        "warning": ("Another profile with this email already exists (C%03d)." % other) if other else "",
    }


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
def login(body: LoginBody, request: Request):
    key = client_key(request, body.email)
    if rate_limited(key):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Please try again in 15 minutes.")
    try:
        result = authenticate(body.email, body.password, body.role)
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))
    if result is None:
        note_attempt(key)
        raise HTTPException(status_code=401, detail="Wrong email, password or portal")
    user, token = result
    return {"token": token, "user": user}


@app.post("/api/forgot-password")
def forgot_password(body: ForgotBody, request: Request):
    key = "forgot|" + client_key(request)
    if rate_limited(key):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again in 15 minutes.")
    note_attempt(key)
    found = create_reset_token(body.email)
    if found is not None:
        user, token = found
        link = os.getenv("APP_URL", "http://localhost:5173") + "/?reset=" + token
        status = send_reset_email(user, link)
        if status != "sent":
            print("[password reset] email " + status + ". Reset link for " + user["email"] + ": " + link)
    return {"message": "If this email is registered, a password reset link has been sent. It works for 30 minutes."}


@app.post("/api/reset-password")
def change_password(body: ResetBody):
    try:
        reset_password(body.token, body.password)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    return {"message": "Your password was changed. You can sign in now."}


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
async def upload_resume(file: UploadFile = File(...), user=Depends(require_roles("hr", "admin", "candidate"))):
    if not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")

    save_name = uuid.uuid4().hex[:8] + "_" + os.path.basename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER, save_name)
    size = 0
    too_big = False
    with open(save_path, "wb") as f:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_UPLOAD_MB * 1024 * 1024:
                too_big = True
                break
            f.write(chunk)
    if too_big:
        os.remove(save_path)
        raise HTTPException(status_code=413, detail="File is too large. The limit is " + str(MAX_UPLOAD_MB) + " MB.")

    try:
        profile = parse_resume(save_path)
    except Exception:
        os.remove(save_path)
        raise HTTPException(status_code=422, detail="Could not read this file")

    return saved_response(profile, save_path, file.filename, user)


@app.post("/api/parse_text")
def parse_typed_details(body: TextBody, user=Depends(require_roles("hr", "admin", "candidate"))):
    if len(body.text.strip()) < 30:
        raise HTTPException(status_code=400, detail="Please type at least a few lines of resume details")

    profile = parse_text(body.text)
    return saved_response(profile, "typed details", "Typed details", user)


@app.post("/api/candidates/manual")
def save_form_details(body: FormBody, user=Depends(require_roles("hr", "admin", "candidate"))):
    if body.name.strip() == "" or "@" not in body.email:
        raise HTTPException(status_code=400, detail="Enter the full name and a valid email")
    if body.experience_years < 0 or body.experience_years > 60:
        raise HTTPException(status_code=400, detail="Experience must be between 0 and 60 years")
    profile = profile_from_form(body.dict())
    return saved_response(profile, "form entry", "Form details", user)


@app.get("/api/candidates")
def candidates(user=Depends(require_roles("hr", "admin"))):
    return get_all_candidates()


@app.get("/api/candidates/{candidate_id}/profile")
def candidate_profile(candidate_id: int, user=Depends(require_roles("hr", "admin"))):
    profile = get_final_profile(candidate_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return profile


@app.get("/api/stats")
def stats(user=Depends(require_roles("hr", "admin"))):
    return get_stats()


@app.delete("/api/candidates/{candidate_id}")
def remove_candidate(candidate_id: int, user=Depends(require_roles("hr", "admin"))):
    if not delete_candidate(candidate_id):
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"deleted": candidate_id}


@app.get("/api/admin/db")
def db_info(user=Depends(require_roles("admin"))):
    # Open this (logged in as admin) to confirm which database the app is really using.
    with Session() as session:
        return {**describe_db(), "candidates": session.query(Candidate).count(), "users": session.query(User).count()}
