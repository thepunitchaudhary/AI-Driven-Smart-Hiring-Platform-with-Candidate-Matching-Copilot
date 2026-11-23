import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL, make_url
from sqlalchemy.orm import declarative_base, sessionmaker

# override=True: values in .env win over old DB_* variables already set in your
# terminal or OS. A stale DB_HOST there is the usual reason an app keeps
# reading the previous database after you switch to Neon.
load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)


def build_url():
    # Preferred: paste Neon's connection string into DATABASE_URL.
    raw = os.getenv("DATABASE_URL", "").strip()
    if raw:
        url = make_url(raw)
        if url.drivername in ("postgres", "postgresql"):
            url = url.set(drivername="postgresql+psycopg")
        return url

    host, name = os.getenv("DB_HOST"), os.getenv("DB_NAME")
    if not host or not name:
        # No silent fallback to localhost: that would quietly use the old database.
        raise RuntimeError("Database is not configured. Set DATABASE_URL (or DB_HOST and DB_NAME) in .env")
    return URL.create(
        drivername="postgresql+psycopg",
        username=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        host=host,
        port=int(os.getenv("DB_PORT", "5432")),
        database=name,
    )


DATABASE_URL = build_url()

# prepare_threshold=None: Neon's "-pooler" host runs PgBouncer, which can break
# psycopg's automatic prepared statements.
connect_args = {"prepare_threshold": None}
if DATABASE_URL.host not in ("localhost", "127.0.0.1") and "sslmode" not in DATABASE_URL.query:
    connect_args["sslmode"] = "require"  # Neon only accepts SSL connections

# pool_recycle + pre_ping: Neon suspends idle compute, so old connections go stale.
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300, connect_args=connect_args)
Session = sessionmaker(bind=engine)
Base = declarative_base()


def describe_db():
    host = DATABASE_URL.host or ""
    return {"host": host, "database": DATABASE_URL.database, "is_neon": "neon.tech" in host}


print("[database] using %(host)s / %(database)s (neon: %(is_neon)s)" % describe_db())
