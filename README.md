# AI-Driven Smart Hiring Platform with Candidate Matching Copilot

A web platform that reads candidate resumes (PDF and DOCX), extracts the key details, and saves them as structured candidate profiles. HR managers and candidates each get their own login portal, and an admin approves new accounts.

> **Current status: Milestone 1 complete** (Resume Parsing and Candidate Profiling). Job description analysis, candidate matching, skill gap reports, interview tools and analytics are planned for the next milestones.

## Features

- Upload resumes in **PDF** and **DOCX** format, one or many at a time
- Automatic extraction of name, email, phone, location, education, experience, skills, projects and certifications
- Structured candidate profiles stored in **PostgreSQL** (hosted on Neon, or a local PostgreSQL)
- Dashboard with resumes processed, fields found, complete profiles and unique skills
- Candidate search by name, email or skill
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
| HR Manager | Upload or type resumes, view and search candidates, delete candidates, see the dashboard |
| Candidate | Upload or type their own resume and see only their own parsed profile |
| Admin | Approve or reject new account requests |

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
python -m spacy download en_core_web_sm
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

## API endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/register` | Public (account starts as pending) |
| POST | `/api/login` | Public |
| GET | `/api/me` | Any logged-in user |
| POST | `/api/upload_resume` | HR Manager, Candidate |
| POST | `/api/parse_text` | HR Manager, Candidate |
| GET | `/api/candidates` | HR Manager |
| GET | `/api/candidates/{id}/profile` | HR Manager |
| GET | `/api/stats` | HR Manager |
| DELETE | `/api/candidates/{id}` | HR Manager |
| GET | `/api/admin/users?status=pending` | Admin |
| POST | `/api/admin/users/{id}/approve` | Admin |
| POST | `/api/admin/users/{id}/reject` | Admin |
| GET | `/api/admin/db` | Admin (shows which database is in use) |

## Project structure

```
.
├── main.py                  # FastAPI app and API routes
├── auth.py                  # Login, registration, approval, roles, JWT tokens
├── emailer.py               # Approval and rejection emails
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

## Optional: pyresparser

pyresparser can be merged with the parser to fill in missing fields. It is off by default because it is an old library.

```bash
pip install pyresparser
python -m nltk.downloader stopwords punkt words averaged_perceptron_tagger maxent_ne_chunker
```

Then add `USE_PYRESPARSER=true` to your `.env` file.

## Roadmap

| Milestone | Scope | Status |
|---|---|---|
| 1 | Resume parsing and candidate profiling, login portals | Done |
| 2 | Job description analysis, candidate matching, skill gap analysis | Planned |
| 3 | Interview question generation, AI interview simulation | Planned |
| 4 | Voice screening, recruitment analytics dashboard, ATS integration | Planned |

## Author

Punit Kumar
