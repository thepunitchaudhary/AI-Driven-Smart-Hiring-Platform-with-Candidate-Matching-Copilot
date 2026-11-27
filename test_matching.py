import random
import zlib

import numpy as np

from matching import score_candidate, skill_gap_report
from matching import embeddings

ROLES = {
    "Data Scientist": (["Python", "Machine Learning", "Statistics", "Pandas", "SQL"], ["TensorFlow", "Scikit-learn", "NumPy"]),
    "Data Analyst": (["SQL", "Excel", "Tableau", "Power BI", "Statistics"], ["Python", "Pandas"]),
    "Web Developer": (["JavaScript", "React", "HTML", "CSS", "Node.js"], ["MongoDB", "Git"]),
    "Backend Developer": (["Python", "FastAPI", "PostgreSQL", "Docker", "REST API"], ["Redis", "AWS"]),
    "DevOps Engineer": (["Docker", "Kubernetes", "AWS", "Jenkins", "Linux"], ["Terraform", "Git"]),
    "Java Developer": (["Java", "Spring Boot", "MySQL", "Hibernate", "Git"], ["Docker", "REST API"]),
}
ALL_SKILLS = sorted({s for core, extra in ROLES.values() for s in core + extra})
THRESHOLD = 60


class FakeModel:
    def encode(self, text):
        vector = np.zeros(64)
        for word in text.lower().replace(":", " ").split():
            vector[zlib.crc32(word.encode()) % 64] += 1
        return vector


def build_pairs():
    rng = random.Random(7)
    jobs = {}
    for role, (core, extra) in ROLES.items():
        jobs[role] = {"title": role, "required_skills": rng.sample(core, 4), "preferred_skills": rng.sample(extra, 2),
                      "experience_years": 2, "education": "Bachelor"}
    candidates = []
    for i, role in enumerate(ROLES):
        core, extra = ROLES[role]
        for n in range(10):
            skills = rng.sample(core, rng.randint(4, 5)) + rng.sample(extra, rng.randint(0, 2)) + rng.sample(ALL_SKILLS, rng.randint(0, 2))
            candidates.append({"candidate_id": i * 10 + n, "name": role + " " + str(n), "role": role,
                               "skills": sorted(set(skills)), "education": ["B.Tech, Some College"],
                               "experience": str(rng.randint(2, 6)) + " years", "projects": [], "certifications": []})
    fit_pairs = [(c, jobs[c["role"]]) for c in candidates]
    other_pairs = []
    while len(other_pairs) < len(fit_pairs):
        c = rng.choice(candidates)
        role = rng.choice([r for r in ROLES if r != c["role"]])
        other_pairs.append((c, jobs[role]))
    return fit_pairs + other_pairs


def evaluate(title, engine=None):
    tp = fp = tn = fn = failed = 0
    pairs = build_pairs()
    for candidate, job in pairs:
        label = candidate["role"] == job["title"]
        predicted = score_candidate(candidate, job)["score"] >= THRESHOLD
        if label and predicted:
            tp += 1
        elif label and not predicted:
            fn += 1
        elif not label and predicted:
            fp += 1
        else:
            tn += 1
        try:
            report = skill_gap_report(candidate, job)
            if not report["skills"] or not report["summary"]:
                failed += 1
        except Exception:
            failed += 1
    total = len(pairs)
    print(title)
    print("  engine: " + (engine or embeddings.engine_name()))
    print("  pairs: %d, threshold: %d" % (total, THRESHOLD))
    print("  accuracy: %.1f%%  precision: %.1f%%  recall: %.1f%%" % ((tp + tn) / total * 100, tp / max(tp + fp, 1) * 100, tp / max(tp + fn, 1) * 100))
    print("  skill-gap reports: %d generated, %d failed" % (total - failed, failed))


evaluate("Matching test with the engine installed on this computer")

embeddings._model = FakeModel()
embeddings._tried = True
embeddings._cache.clear()
evaluate("Same test with a stand-in embedding model (checks the embedding code path)", engine="stand-in word-count vectors (NOT the real model)")
