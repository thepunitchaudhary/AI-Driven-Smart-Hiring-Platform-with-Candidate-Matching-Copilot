import threading

import numpy as np

MODEL_NAME = "all-MiniLM-L6-v2"
STOP_WORDS = ["skills", "required", "preferred", "education", "experience", "years", "year"]

_model = None
_tried = False
_lock = threading.Lock()
_cache = {}


def get_model():
    global _model, _tried
    with _lock:
        if not _tried:
            _tried = True
            try:
                from sentence_transformers import SentenceTransformer
                _model = SentenceTransformer(MODEL_NAME)
            except Exception:
                _model = None
    return _model


def engine_name():
    if get_model() is not None:
        return "sentence-transformers (" + MODEL_NAME + ")"
    return "TF-IDF fallback"


def generate_embedding(text):
    model = get_model()
    if model is None:
        return None
    if text not in _cache:
        if len(_cache) > 5000:
            _cache.clear()
        _cache[text] = np.asarray(model.encode(text), dtype=float)
    return _cache[text]


def cosine(a, b):
    denominator = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denominator == 0:
        return 0.0
    return float(np.dot(a, b) / denominator)


def tfidf_similarity(text_a, text_b):
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        matrix = TfidfVectorizer(stop_words=STOP_WORDS).fit_transform([text_a, text_b])
        return float(matrix[0].multiply(matrix[1]).sum())
    except Exception:
        return 0.0


def text_similarity(text_a, text_b):
    if get_model() is not None:
        raw = cosine(generate_embedding(text_a), generate_embedding(text_b))
        return min(max(raw, 0.0), 1.0)
    return min(max(tfidf_similarity(text_a, text_b), 0.0), 1.0)
