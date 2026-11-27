# AI-Driven Smart Hiring Platform with Candidate Matching Copilot

A web platform that reads candidate resumes (PDF and DOCX), extracts the key details, and saves them as structured candidate profiles. HR managers and candidates each get their own login portal, and an admin approves new accounts.

> **Current status: Milestone 1 complete** (Resume Parsing and Candidate Profiling). **Milestone 2 is built** (job description analysis, candidate matching, hiring score and skill-gap reports); with the real embedding model it scores 91.7% matching accuracy on the generated test set, against the 85% target (see `MATCHING_REPORT.md`). Interview tools and analytics are planned for the next milestones.

## Features

- Upload resumes in **PDF** and **DOCX** format, one or many at a time
- Automatic extraction of name, email, phone, location, education, experience, skills, projects and certifications
- Structured candidate profiles stored in **PostgreSQL** (hosted on Neon, or a local PostgreSQL)
- Dashboard with resumes processed, fields found, complete profiles and unique skills
- Candidate search by name, email or skill
- **Job postings:** HR or the admin posts a job, and the admin approves HR's jobs before they go live
- **Skills picked from a job description** (required and preferred skills, experience and education)
- **Candidate-job matching** with a match score and hiring recommendation
- **Skill-gap analysis** with skill levels, suggested courses and estimated learning time
- **Candidates apply for open jobs** and track their applications
- **Resume form** with boxes for name, city, experience, education and skills, as well as file upload and pasted text
- **Three portals** with role-based access: HR Manager, Candidate and Admin
- **Admin approval:** new accounts start as pending, and an admin approves or rejects them
- **Email notice** to the user when the account is approved or rejected (free with a Gmail App Password)
- Upload a resume file, or **type the resume details** on the website and have them parsed
- Secure login with JWT tokens and hashed passwords

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), lucide-react icons |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Neon or local) with SQLAlchemy |
| Resume parsing | pdfplumber, python-docx, rules, spaCy, rapidfuzz, a 570+ skill list |
| Matching | Rule-based scoring plus semantic similarity (sentence-transformers or scikit-learn TF-IDF) |
| Authentication | PyJWT, PBKDF2 password hashing |

## How it works

```
React website --> FastAPI backend --> Resume parser --> PostgreSQL
 (login, upload,    (login, upload,    PDF/DOCX reader, then      (candidates,
  dashboard)         candidates API)   contact, skills, education   users)
                                       and experience extraction
```

1. A user uploads a PDF or DOCX resume.
2. The text is extracted from the file.
3. Each field is found with rules: section headings, patterns for email and phone, date ranges for experience, and a skills list with more than 570 skills.
4. spaCy NER helps when the rules cannot find a name, a location or a college. rapidfuzz matches skills written in different ways, such as `MachineLearning`, `Scikit Learn` or `ML`.
5. The result is saved as a structured profile in the database.

Example profile returned as `candidate_profile`:

```json
{
  "candidate_id": "C001",
  "name": "John Doe",
  "email": "john@gmail.com",
  "phone": "9876543210",
  "skills": ["Python", "FastAPI", "SQL", "Docker"],
  "education": [{"degree": "B.Tech", "college": "VTU", "year": "2022"}],
  "experience_years": 3,
  "projects": ["AI Hiring System"],
  "certifications": ["AWS Practitioner"]
}
```

## User roles

| Portal | What they can do |
|---|---|
| HR Manager | Upload or enter resumes, view and search candidates, delete candidates, post jobs, see matches and skill gaps, shortlist applicants |
| Candidate | Add their own resume, see open jobs with their match score, apply, and track applications |
| Admin | Approve accounts and job posts, post jobs that go live at once, enter resumes, and use the same views as HR |

Access is checked in the backend on every request, not only hidden in the screen.

## Getting started

### Requirements

- Python 3.11 or newer
- Node.js 18 or newer
- PostgreSQL (a free Neon database, or a local installation)

### 1. Clone the project

```bash
git clone https://github.com/thepunitchaudhary/AI-Driven-Smart-Hiring-Platform-with-Candidate-Matching-Copilot.git
cd AI-Driven-Smart-Hiring-Platform-with-Candidate-Matching-Copilot
```

### 2. Create the database

**Neon (hosted):** create a project at neon.tech, then copy its connection string.

**Local PostgreSQL:** create an empty database named `recruitment_db` in pgAdmin, or run this in `psql`:

```sql
CREATE DATABASE recruitment_db;
```

The tables are created automatically the first time the backend starts.

### 3. Add your settings

Copy `.env.example` to `.env` and fill in your values. For Neon, paste its connection string into `DATABASE_URL`:

```
DATABASE_URL=postgresql://user:password@your-host.neon.tech/dbname?sslmode=require
SECRET_KEY=put-a-long-random-text-here
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=choose-a-strong-admin-password
```

For a local database you can use these instead of `DATABASE_URL`:

```
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recruitment_db
```

Values in `.env` win over settings already in your terminal. `.env` is ignored by Git, so your passwords are never uploaded. When the backend starts it prints which database it connected to.

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

## Accounts and approval

1. A new user opens the login page, chooses a portal (HR Manager or Candidate), clicks **New here? Create account** and signs up with a real email address.
2. The account is **pending**. The user cannot sign in until the admin approves it, and sees the message "Your account is waiting for admin approval".
3. The admin signs in through the **Admin** portal, opens **User Approvals**, and clicks **Approve** or **Reject**.
4. The user gets an email, if email is set up, and can then sign in.

The admin account is created automatically when the backend starts, from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file. Change the default password. Nobody can sign up as an admin.

Accounts that existed before the approval feature was added are marked as approved. Old Recruiter accounts were moved to the HR Manager role.

## Email notifications (free with Gmail)

Email is optional. Without it, everything works and the admin screen shows that no email was sent.

1. In your Google account, turn on **2-Step Verification**.
2. Open Google Account, then Security, then **App passwords**, and create one named "Recruitment Copilot". Copy the 16-letter password.
3. Add these lines to your `.env` file:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASSWORD=your_16_letter_app_password
EMAIL_FROM=your_gmail_address@gmail.com
APP_URL=http://localhost:5173
```

4. Restart the backend. Emails may land in the spam folder at first. Gmail limits how many emails you can send each day, which is enough for a project.

Never put the app password in the code or on GitHub.

## Forgot password

On the sign-in page, **Forgot password?** asks for the account email and sends a reset link by email.

- The link works for 30 minutes and only once. A new request cancels the old link.
- The link opens a page where the user types a new password twice.
- The page always shows the same message, whether or not the email is registered, so nobody can find out who has an account.
- Only a hash of the reset token is stored in the database.

It uses the same email settings as account approval (see "Email notifications" above), plus `APP_URL` in `.env`, which is the address placed in the link. If email is not set up, the backend prints the reset link in its terminal, so you can still test the flow on your own computer.

## API endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/register`, `/api/login`, `/api/forgot-password`, `/api/reset-password` | Public |
| GET | `/api/me` | Any logged-in user |
| POST | `/api/upload_resume`, `/api/parse_text`, `/api/candidates/manual` | HR Manager, Admin, Candidate |
| GET | `/api/candidates`, `/api/candidates/{id}/profile`, `/api/stats` | HR Manager, Admin |
| DELETE | `/api/candidates/{id}` | HR Manager, Admin |
| POST | `/api/jobs/analyze`, `/api/jobs` | HR Manager, Admin |
| GET | `/api/jobs?status=` | HR Manager, Admin |
| POST | `/api/jobs/{id}/approve`, `/api/jobs/{id}/reject` | Admin |
| DELETE | `/api/jobs/{id}` | Admin, or the HR Manager who posted it |
| GET | `/api/jobs/{id}/matches`, `/api/jobs/{id}/skill-gap/{candidate_id}`, `/api/jobs/{id}/skill-gaps` | HR Manager, Admin |
| POST | `/api/applications/{id}/status` | HR Manager, Admin |
| GET | `/api/my/profile`, `/api/jobs/open`, `/api/my/applications` | Candidate |
| POST | `/api/jobs/{id}/apply` | Candidate |
| GET | `/api/admin/users`, `/api/admin/db` | Admin |
| POST | `/api/admin/users/{id}/approve`, `/api/admin/users/{id}/reject` | Admin |

## Project structure

```
.
├── main.py                  # FastAPI app and API routes
├── auth.py                  # Login, registration, approval, roles, JWT tokens
├── emailer.py               # Approval and rejection emails
├── jobs_api.py              # Jobs, matching, skill gaps and applications
├── matching/
│   ├── embeddings.py        # Semantic similarity (sentence-transformers, with a TF-IDF fallback)
│   ├── profile_text.py      # Turns a candidate and a job into text
│   ├── scoring.py           # Match score and hiring recommendation
│   ├── skill_gap.py         # Skill levels, courses and skill-gap report
│   ├── matcher.py           # Ranks candidates for a job
│   └── evaluate.py          # evaluate_candidate and rank_candidates in the Milestone 2 document's format
├── jobs/
│   └── jd_parser.py         # Picks skills, experience and education from a job description
├── test_matching.py         # Matching accuracy test
├── queries.py               # Candidate list, stats, final profile JSON, delete
├── requirements.txt         # Python packages
├── .env.example             # Example settings (copy to .env)
├── parser/
│   ├── pdf_parser.py        # Reads text from PDF files
│   ├── docx_parser.py       # Reads text from DOCX files
│   └── resume_parser.py     # Combines all extractors into one profile
├── extraction/
│   ├── contact_extractor.py    # Name, email, phone, location
│   ├── skill_extractor.py      # Skill matching, aliases, fuzzy matching
│   ├── education_extractor.py  # Degree, college, year
│   ├── experience_extractor.py # Years of experience from dates
│   ├── section_extractor.py    # Finds Education, Skills, Projects sections
│   └── nlp_model.py            # Loads the spaCy model
├── database/
│   ├── db.py                # Database connection (Neon or local PostgreSQL)
│   └── models.py            # Candidate table and save function
├── skills/
│   └── skills.csv           # 570+ skills with aliases
├── dataset/                 # Sample resumes (not uploaded to Git)
├── uploads/                 # Resumes saved by the backend (not uploaded to Git)
└── frontend/                # React website
```

## Screenshots

| Login portals | Resume upload |
|---|---|
| ![Login](docs/screenshots/login.png) | ![Upload](docs/screenshots/upload.png) |

| HR dashboard | Candidates list |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Candidates](docs/screenshots/candidates.png) |

## Parser accuracy

The parser scored 100% on 70 generated PDF and DOCX test resumes with known correct answers, against the 95% target in the milestone. These test resumes are generated, so real resumes with unusual layouts may score lower. See `ACCURACY_REPORT.md` for the method and results.

## Known limits

- Rules do most of the work. spaCy is used as a fallback for names, locations and colleges, and it is not perfect.
- Fuzzy matching only fixes close spellings, not big typos.
- Resumes that contain no name return an empty name instead of a guess.
- Two-column PDF layouts can mix up the text order.

## Semantic matching

The match score combines skill matching with how similar the candidate's profile text is to the job text. By default the app uses scikit-learn TF-IDF, which needs no download and is what `requirements.txt` installs. This keeps the deployment small, because embeddings need PyTorch.

For embedding-based matching (model `all-MiniLM-L6-v2`), install the optional packages once, on a machine with enough memory:

```bash
pip install -r requirements-semantic.txt
```

The first start downloads PyTorch and a model of about 100 MB, so it needs internet. If the package is missing or the model cannot be loaded, the app falls back to TF-IDF. Check which engine is in use:

```bash
python -c "from matching.embeddings import engine_name; print(engine_name())"
```

The Matching page also shows the engine name. If the model cannot be loaded, the app falls back to TF-IDF and keeps working.

## Optional: pyresparser

pyresparser can be merged with the parser to fill in missing fields. It is off by default because it is an old library.

```bash
pip install pyresparser
python -m nltk.downloader stopwords punkt words averaged_perceptron_tagger maxent_ne_chunker
```

Then add `USE_PYRESPARSER=true` to your `.env` file.

## Deployment settings

Set these on the host. All are optional for local use.

| Setting | Where | What it does |
|---|---|---|
| `SECRET_KEY` | backend | Signs login tokens. **Must be set to a long random value in production**. The app prints a warning if the built-in development key is in use. |
| `FRONTEND_ORIGINS` | backend | Comma-separated website addresses allowed to call the API, for example `https://myapp.vercel.app`. Default: `http://localhost:5173,http://127.0.0.1:5173`. |
| `APP_URL` | backend | The website address placed in password-reset and approval emails. |
| `MAX_UPLOAD_MB` | backend | Largest resume file accepted. Default: 10. |
| `VITE_API_URL` | frontend, set at build time | The backend address, for example `https://my-api.onrender.com` (no trailing slash). Default: `http://127.0.0.1:8000`. |

Sign-in and password-reset requests are limited to 8 attempts per 15 minutes for each address and email.

## Roadmap

| Milestone | Scope | Status |
|---|---|---|
| 1 | Resume parsing and candidate profiling, login portals | Done |
| 2 | Job description analysis, candidate matching, skill gap analysis | Built and tested: 91.7% matching accuracy on the generated test set, target 85% (see `MATCHING_REPORT.md`) |
| 3 | Interview question generation, AI interview simulation | Planned |
| 4 | Voice screening, recruitment analytics dashboard, ATS integration | Planned |

## License

This project is licensed under the MIT License.
See the [LICENSE](LICENSE) file for details.

## Author

Punit Kumar
