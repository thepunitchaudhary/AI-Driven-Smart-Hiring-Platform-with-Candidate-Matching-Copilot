# Milestone 2 - Matching and Skill-Gap Report

## How the hiring score works
This follows the formula in the Milestone 2 document. Each candidate gets a score from 0 to 100 for each job.

| Part | Weight | How it is measured |
|---|---|---|
| Skill score | 40% | Share of the job's skills the candidate has. Required skills count double and preferred skills count once. |
| Semantic score | 30% | Cosine similarity between the candidate text and the job text, times 100 |
| Experience score | 20% | 100 if the candidate has the years needed, otherwise years divided by years needed |
| Education score | 10% | 100 if the candidate meets the education needed (or has B.Tech, B.E, M.Tech, M.E, MCA or PhD when none is set), otherwise 50 |

`hiring score = skill x 0.40 + semantic x 0.30 + experience x 0.20 + education x 0.10`

The three worked examples in the document give the same numbers in this code: hiring score 86.4, skill score 75 and experience score 50.

The score also gives a hiring recommendation: 80 or more = Highly recommend, 65 to 79 = Recommend, 50 to 64 = Consider, below 50 = Not recommended. Candidates are ranked by this score.

## Semantic similarity
- With `sentence-transformers` installed, the job text and the candidate text are turned into embeddings with the model `all-MiniLM-L6-v2`, and their cosine similarity is used. The raw cosine value is used as it is, as in the document.
- Without it, the app uses scikit-learn TF-IDF cosine similarity. Nothing needs to be downloaded.
- Short names and spellings such as `ML` are also handled by the skill list aliases from Milestone 1.

## Skill-gap report
For every required and preferred skill the report shows a level: None, Basic, Intermediate or Advanced.
- None: the skill is not on the resume.
- Basic: the skill is listed.
- Intermediate: it also appears in a project or certification, or the candidate has 1 or more years of experience.
- Advanced: it appears in a project or certification and the candidate has 3 or more years of experience.

The levels are estimated from the resume. They are a rule of thumb, not a skills test. The report also lists missing skills, suggested courses and an estimated learning time (2 weeks per missing required skill and 1 week per missing preferred skill).

## Test result
`python test_matching.py` builds 6 jobs and 60 candidates (10 per job role). It compares 120 candidate-job pairs: 60 where the candidate belongs to the job's role and 60 where they do not. A pair counts as a fit when the score is 60 or more.

| Run | Matching accuracy | Skill-gap reports |
|---|---|---|
| TF-IDF engine | 100.0% | 120 of 120 |
| Stand-in embedding model (a simple word-count vector, used to test the embedding code path) | 94.2% | 120 of 120 |
| Real `all-MiniLM-L6-v2` model (run on the project owner's computer) | 91.7% (precision 85.7%, recall 100.0%) | 120 of 120 |

With the real model, all 60 same-role pairs were found (recall 100%), and 10 of the 60 different-role pairs also scored 60 or more (precision 85.7%). So the 91.7% comes from those 10 false fits. This is above the 85% target, but it was measured on generated data.

Targets from the milestone document: matching accuracy of at least 85%, and skill-gap analysis generated for all evaluated candidates.

## Limits (say this clearly in the viva)
- The test data is generated, and the fit label means "same role". That is easy for the engine, because it works from skills. Real hiring decisions are less clear.
- With the real model, unrelated texts can still get a semantic score of 20 to 30. Check this with real resumes and adjust the recommendation levels if needed.
- To strengthen the result, label 30 to 50 real candidate-job pairs yourself as "fit" or "not a fit" and measure how often the engine agrees.
- Skills not in the 579-skill list are not matched by name.
- The skill-gap report is calculated when it is opened. It is not saved in a database table.
- No large language model is used yet.
