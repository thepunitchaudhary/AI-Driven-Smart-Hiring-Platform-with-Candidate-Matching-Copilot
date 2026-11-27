from matching.embeddings import text_similarity
from matching.scoring import score_candidate


def semantic_match(candidate_text, jd_text):
    return round(text_similarity(candidate_text, jd_text) * 100, 2)


def rank_candidates(candidates, job):
    ranked = []
    for candidate in candidates:
        ranked.append({"candidate": candidate, "result": score_candidate(candidate, job)})
    ranked.sort(key=lambda item: item["result"]["score"], reverse=True)
    return ranked
