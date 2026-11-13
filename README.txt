AI-Driven Smart Hiring Platform - Milestone 1
Resume Parsing and Candidate Profiling

SETUP (one time)
1. Create database recruitment_db in pgAdmin (or run schema.sql)
2. Open database.py and set DB_PASSWORD to your PostgreSQL password
3. python -m venv myvenv
   myvenv\Scripts\activate
   pip install -r requirements.txt

RUN BACKEND (terminal 1)
   myvenv\Scripts\activate
   uvicorn main:app --reload
   Check http://127.0.0.1:8000/docs

RUN FRONTEND (terminal 2)
   cd frontend
   npm install
   npm run dev
   Open http://localhost:5173

Put Kaggle resume PDFs in the dataset folder.

DEMO LOGINS (password: demo123)
   Recruiter   recruiter@demo.com
   HR Manager  hr@demo.com
   Candidate   candidate@demo.com

TEST THE PARSER
   python generate_test_resumes.py 1 20 test_resumes
   python test_resume_parser.py test_resumes
   Sample PDF and DOCX files are in test_resumes and holdout_resumes.
   Upload them through the website to test both formats.
   See ACCURACY_REPORT.md for results.
