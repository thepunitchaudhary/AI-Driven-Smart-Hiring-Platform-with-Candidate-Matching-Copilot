# Milestone 1 - Parser Accuracy Report

## Method
- Test resumes are generated with known correct answers (PDF and DOCX, 6 layout styles).
- A field counts as correct only if the extracted value matches the expected value.
  - name, email: exact match (ignoring case)
  - phone: same digits
  - location, experience: exact match
  - education: expected degree and college both found
  - skills: at least 90% of expected skills found and at most 10% extra skills
  - projects, certifications: every expected item found (empty must stay empty)
- 9 fields are checked per resume.

## Results
| Set | Resumes | Fields correct | Accuracy |
|---|---|---|---|
| Development (used while building the parser) | 20 | 180 / 180 | 100.00% |
| Hold-out (never used for tuning) | 20 | 180 / 180 | 100.00% |
| Extra unseen set (different seed) | 30 | 270 / 270 | 100.00% |
| Hold-out with pyresparser merged in | 20 | 180 / 180 | 100.00% |

Target from the milestone document: at least 95%.

## Parser features used
- Rule-based extraction with section detection
- spaCy NER (PERSON, GPE/LOC, ORG) as a fallback for name, location and college
- Skill list of 579 skills with aliases in `skills/skills.csv`
- rapidfuzz fuzzy matching for skills written in different ways
- Optional pyresparser merge (`USE_PYRESPARSER=true`)

## Bugs found and fixed while testing
- Section headings such as "Academic Background" were read as a candidate name.
- The alias "js" made Node.js resumes also report JavaScript.
- The spaCy college fallback returned subject names such as "Computer Science" as a college. It now accepts only real college names.

## Limits (say this clearly in the viva)
- The test resumes are generated, so real resumes with messy layouts will score lower. Test resumes were written to avoid skill words in unrelated places (for example job titles), which makes the test easier than real life.
- Fuzzy matching only fixes close spellings (similarity 90% or more).
- spaCy fallbacks for names and locations are modest. A resume with no name returns an empty name.
- Two-column PDFs can mix up the text order.
- To strengthen the result, add 10 to 20 real resumes with your own correct answers to `expected.json` and re-run `python test_resume_parser.py <folder>`.
