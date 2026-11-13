# AI-Driven Smart Hiring Platform with Candidate Matching Copilot

A web platform that reads candidate resumes (PDF and DOCX), extracts the key details, and saves them as structured candidate profiles. Recruiters, HR managers and candidates each get their own login portal.

> **Current status: Milestone 1 complete** (Resume Parsing and Candidate Profiling). Job description analysis, candidate matching, skill gap reports, interview tools and analytics are planned for the next milestones.

## Features

- Upload resumes in **PDF** and **DOCX** format, one or many at a time
- Automatic extraction of name, email, phone, location, education, experience, skills, projects and certifications
- Structured candidate profiles stored in **PostgreSQL**
- Dashboard with resumes processed, fields found, complete profiles and unique skills
- Candidate search by name, email or skill
- **Three login portals** with role-based access: Recruiter, HR Manager and Candidate
- Secure login with JWT tokens and hashed passwords

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), lucide-react icons |
| Backend | FastAPI (Python) |
| Database | PostgreSQL with SQLAlchemy |
| Resume parsing | pdfplumber, python-docx, regular expressions |
| Authentication | PyJWT, PBKDF2 password hashing |

## How it works

```
React website  -->  FastAPI backend  -->  Resume parser  -->  PostgreSQL
 (login, upload,     (login, upload,      (text extraction,    (candidates,
  dashboard)          candidates API)      rule-based fields)   users)
```

1. A user uploads a PDF or DOCX resume.
2. The text is extracted from the file.
3. Rules find each field: section headings, patterns for email and phone, a skills list, and date ranges for experience.
4. The result is saved as a structured profile in the database.

Example profile:

```json
{
  "name": "John Doe",
  "email": "abc@gmail.com",
  "skills": ["Python", "SQL", "Machine Learning"],
  "experience": "4 years"
}
```

## User roles

| Portal | What they can do |
|---|---|
| Recruiter | Upload resumes, view and search candidates, delete candidates |
| HR Manager | View the dashboard and candidates (view only) |
| Candidate | Upload their own resume and see only their own parsed profile |

Access is checked in the backend on every request, not only hidden in the screen.

## Getting started

### Requirements

- Python 3.11 or newer
- Node.js 18 or newer
- PostgreSQL

### 1. Clone the project

```bash
git clone https://github.com/thepunitchaudhary/AI-Driven-Smart-Hiring-Platform-with-Candidate-Matching-Copilot.git
cd AI-Driven-Smart-Hiring-Platform-with-Candidate-Matching-Copilot
```

### 2. Create the database

In pgAdmin, create a database named `recruitment_db`. You can also run this in `psql`:

```sql
CREATE DATABASE recruitment_db;
```

The tables are created automatically the first time the backend starts.

### 3. Add your settings

Copy `.env.example` to `.env` and fill in your values:

```
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recruitment_db
SECRET_KEY=put-a-long-random-text-here
```

`.env` is ignored by Git, so your password is never uploaded.

### 4. Start the backend

```bash
python -m venv myvenv
myvenv\Scripts\activate        # Windows
# source myvenv/bin/activate   # macOS / Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Interactive API docs are at `http://127.0.0.1:8000/docs`.

### 5. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Demo accounts

These accounts are created automatically when the backend starts. The password for all of them is `demo123`.

| Portal | Email |
|---|---|
| Recruiter | recruiter@demo.com |
| HR Manager | hr@demo.com |
| Candidate | candidate@demo.com |

You can also create your own account on the login page.

## API endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/register` | Public |
| POST | `/api/login` | Public |
| GET | `/api/me` | Any logged-in user |
| POST | `/api/upload_resume` | Any logged-in user |
| GET | `/api/candidates` | Recruiter, HR Manager |
| GET | `/api/stats` | Recruiter, HR Manager |
| DELETE | `/api/candidates/{id}` | Recruiter |

## Project structure

```
.
├── main.py              # FastAPI app and API routes
├── auth.py              # Login, registration, roles, JWT tokens
├── database.py          # Database connection and Candidate table
├── queries.py           # Candidate list, stats and delete
├── resume_parser.py     # PDF/DOCX reading and field extraction
├── requirements.txt     # Python packages
├── .env.example         # Example settings (copy to .env)
├── dataset/             # Sample resumes for testing (not uploaded to Git)
├── uploads/             # Resumes saved by the backend (not uploaded to Git)
└── frontend/
    └── src/
        ├── App.jsx            # Layout, navigation, role-based pages
        ├── LoginPage.jsx      # Three-portal login screen
        ├── UploadPage.jsx     # Resume upload and parsing results
        ├── CandidateTable.jsx # Candidate list
        └── api.js             # Calls to the backend
```

## Parser accuracy

The parser was tested on generated PDF and DOCX resumes with known correct answers, and scored above the 95% target in the milestone. These test resumes are generated, so real resumes with unusual layouts may score lower. See `ACCURACY_REPORT.md` for the method and results.

## Known limits

- Fields are found with rules and patterns, not with a language model.
- Skills come from a fixed list of about 90 skills.
- Resumes that contain no name return an empty name instead of a guess.
- Two-column PDF layouts can mix up the text order.

## Roadmap

| Milestone | Scope | Status |
|---|---|---|
| 1 | Resume parsing and candidate profiling, login portals | Done |
| 2 | Job description analysis, candidate matching, skill gap analysis | Planned |
| 3 | Interview question generation, AI interview simulation | Planned |
| 4 | Voice screening, recruitment analytics dashboard, ATS integration | Planned |
