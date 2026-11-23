import hashlib
import hmac
import os
import secrets
import time
from datetime import datetime

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import Column, Integer, String, DateTime, inspect, text

from database import Base, engine, Session

SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-secret-key-please-set-your-own-in-env-file")
SIGNUP_ROLES = ["hr", "candidate"]


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100))
    email = Column(String(100), unique=True)
    password_hash = Column(String(255))
    role = Column(String(20))
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.now)


Base.metadata.create_all(engine)


def add_missing_columns():
    names = [column["name"] for column in inspect(engine).get_columns("users")]
    with engine.begin() as connection:
        if "status" not in names:
            connection.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'approved'"))
        if "created_at" not in names:
            connection.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMP"))
        # The Recruiter portal was removed; existing recruiter accounts become HR Manager accounts.
        connection.execute(text("UPDATE users SET role = 'hr' WHERE role = 'recruiter'"))


add_missing_columns()


def hash_password(password):
    salt = secrets.token_hex(8)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()
    return salt + "$" + digest


def verify_password(password, stored):
    salt, digest = stored.split("$")
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()
    return hmac.compare_digest(check, digest)


def user_to_dict(user):
    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def create_token(user):
    payload = {"sub": str(user.user_id), "exp": int(time.time()) + 8 * 3600}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def register_user(name, email, password, role):
    email = email.strip().lower()
    if role not in SIGNUP_ROLES:
        raise ValueError("Invalid role")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters")
    if "@" not in email or name.strip() == "":
        raise ValueError("Enter a valid name and email")
    with Session() as session:
        if session.query(User).filter(User.email == email).first():
            raise ValueError("This email is already registered")
        user = User(name=name.strip(), email=email, password_hash=hash_password(password),
                    role=role, status="pending")
        session.add(user)
        session.commit()
        return user_to_dict(user)


def authenticate(email, password, role):
    with Session() as session:
        user = session.query(User).filter(User.email == email.strip().lower()).first()
        if user is None or user.role != role:
            return None
        if not verify_password(password, user.password_hash):
            return None
        if user.status == "pending":
            raise PermissionError("Your account is waiting for admin approval")
        if user.status == "rejected":
            raise PermissionError("Your account request was rejected by the admin")
        return user_to_dict(user), create_token(user)


def seed_admin():
    email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("ADMIN_PASSWORD", "")
    name = os.getenv("ADMIN_NAME", "Admin")
    if email == "" or password == "":
        return
    with Session() as session:
        if session.query(User).filter(User.email == email).first():
            return
        session.add(User(name=name, email=email, password_hash=hash_password(password),
                         role="admin", status="approved"))
        session.commit()


def list_users(status):
    with Session() as session:
        query = session.query(User).filter(User.role != "admin")
        if status:
            query = query.filter(User.status == status)
        rows = query.order_by(User.user_id.desc()).all()
        return [user_to_dict(row) for row in rows]


def set_user_status(user_id, status):
    with Session() as session:
        user = session.get(User, user_id)
        if user is None or user.role == "admin":
            return None
        user.status = status
        session.commit()
        return user_to_dict(user)


security = HTTPBearer(auto_error=False)


def current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Please log in")
    try:
        data = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")
    with Session() as session:
        user = session.get(User, int(data["sub"]))
        if user is None or user.status != "approved":
            raise HTTPException(status_code=401, detail="User not found or not approved")
        return user_to_dict(user)


def require_roles(*roles):
    def checker(user=Depends(current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="You do not have access to this")
        return user
    return checker
