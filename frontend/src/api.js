const API_URL = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = "Bearer " + token;
  }
  const response = await fetch(API_URL + path, { ...options, headers });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.detail || "Something went wrong");
    error.status = response.status;
    throw error;
  }
  return data;
}

function sendJson(path, body) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function login(email, password, role) {
  return sendJson("/api/login", { email, password, role });
}

export function register(name, email, password, role) {
  return sendJson("/api/register", { name, email, password, role });
}

export function uploadResume(file) {
  const formData = new FormData();
  formData.append("file", file);
  return request("/api/upload_resume", { method: "POST", body: formData });
}

export function getCandidates() {
  return request("/api/candidates");
}

export function getStats() {
  return request("/api/stats");
}

export function deleteCandidate(id) {
  return request("/api/candidates/" + id, { method: "DELETE" });
}
