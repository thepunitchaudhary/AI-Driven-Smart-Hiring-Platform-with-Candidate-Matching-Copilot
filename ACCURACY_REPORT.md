# Milestone 1 - Parser Accuracy Report

## Method
- 40 test resumes (a mix of PDF and DOCX files, 6 layout styles) were generated with known correct answers (`generate_test_resumes.py`).
- Set 1: `test_resumes/` (20 resumes) was used while building the parser.
- Set 2: `holdout_resumes/` (20 resumes) was generated afterwards with a different seed and was not used for tuning.
- Run `python test_resume_parser.py test_resumes` or `python test_resume_parser.py holdout_resumes`.
- A field counts as correct only if the extracted value matches the expected value.
  - name, email: exact match (ignoring case)
  - phone: same digits
  - location, experience: exact match
  - education: expected degree and university both found
  - skills: at least 90% of expected skills found and at most 10% extra skills
  - projects, certifications: every expected item found (empty must stay empty)
- 9 fields x 20 resumes = 180 checks per set.

## Results
| Set | Resumes | Fields correct | Accuracy |
|---|---|---|---|
| Development | 20 | 180 / 180 | 100.00% |
| Hold-out | 20 | 180 / 180 | 100.00% |

Target from the milestone document: at least 95%.

## Bugs found and fixed while testing
- Section headings such as "Academic Background" were read as a candidate name.
- The alias "js" made Node.js resumes also report JavaScript.
- Job titles are no longer read as names.
- Experience is now calculated from work date ranges (education dates are ignored).

## Limits (be honest in the viva)
- The test resumes are synthetic. Real resumes have more varied layouts, so real-world accuracy will be lower.
- The skills list is fixed (about 90 skills). Skills outside the list are not found.
- Resumes without a name (for example the Kaggle ones that start with a job title) return an empty name on purpose.
- Two-column PDFs can mix up the text order.
- To strengthen the result, add 10 to 20 real resumes with your own answers to `expected.json` and re-run the test.
