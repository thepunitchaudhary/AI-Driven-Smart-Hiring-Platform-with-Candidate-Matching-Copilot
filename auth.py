import hashlib
import os
import hmac
import secrets
import time
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import Column, Integer, String
from database import Base, engine, Session

SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-secret-key-please-set-your-own-in-env-file")
ROLES = ["recruiter", "hr", "candidate"]

DEMO_USERS = [
    ("Rita Recruiter", "recruiter@demo.com", "demo123", "recruiter"),
    ("Harry HR Manager", "hr@demo.com", "demo123", "hr"),
    ("Candy Candidate", "candidate@demo.com", "demo123", "candidate"),
]


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100))
    email = Column(String(100), unique=True)
    password_hash = Column(String(255))
    role = Column(String(20))


Base.metadata.create_all(engine)


def hash_password(password):
    salt = secrets.token_hex(8)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()
    return salt + "$" + digest


def verify_password(password, stored):
    salt, digest = stored.split("$")
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()
    return hmac.compare_digest(check, digest)


def user_to_dict(user):
    return {"user_id": user.user_id, "name": user.name, "email": user.email, "role": user.role}


def create_token(user):
    payload = {"sub": str(user.user_id), "exp": int(time.time()) + 8 * 3600}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def register_user(name, email, password, role):
    email = email.strip().lower()
    if role not in ROLES:
        raise ValueError("Invalid role")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters")
    if "@" not in email or name.strip() == "":
        raise ValueError("Enter a valid name and email")
    with Session() as session:
        if session.query(User).filter(User.email == email).first():
            raise ValueError("This email is already registered")
        user = User(name=name.strip(), email=email, password_hash=hash_password(password), role=role)
        session.add(user)
        session.commit()
        return user_to_dict(user), create_token(user)


def authenticate(email, password, role):
    with Session() as session:
        user = session.query(User).filter(User.email == email.strip().lower()).first()
        if user is None or user.role != role:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user_to_dict(user), create_token(user)


def seed_demo_users():
    for name, email, password, role in DEMO_USERS:
        try:
            register_user(name, email, password, role)
        except ValueError:
            pass


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
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user_to_dict(user)


def require_roles(*roles):
    def checker(user=Depends(current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="You do not have access to this")
        return user
    return checker
