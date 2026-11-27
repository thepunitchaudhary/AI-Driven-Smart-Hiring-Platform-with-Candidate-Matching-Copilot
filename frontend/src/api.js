const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = "Bearer " + token;
  }
  const response = await fetch(API_URL + path, { ...options, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
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

export function parseText(text) {
  return sendJson("/api/parse_text", { text });
}

export function getUsers(status) {
  return request("/api/admin/users?status=" + status);
}

export function approveUser(id) {
  return request("/api/admin/users/" + id + "/approve", { method: "POST" });
}

export function rejectUser(id) {
  return request("/api/admin/users/" + id + "/reject", { method: "POST" });
}

export function saveManualResume(form) {
  return sendJson("/api/candidates/manual", form);
}

export function getMyProfile() {
  return request("/api/my/profile");
}

export function analyzeJd(text) {
  return sendJson("/api/jobs/analyze", { text });
}

export function createJob(job) {
  return sendJson("/api/jobs", job);
}

export function getJobs(status = "") {
  return request("/api/jobs" + (status ? "?status=" + status : ""));
}

export function approveJob(id) {
  return request("/api/jobs/" + id + "/approve", { method: "POST" });
}

export function rejectJob(id) {
  return request("/api/jobs/" + id + "/reject", { method: "POST" });
}

export function deleteJob(id) {
  return request("/api/jobs/" + id, { method: "DELETE" });
}

export function getMatches(jobId) {
  return request("/api/jobs/" + jobId + "/matches");
}

export function getSkillGap(jobId, candidateId) {
  return request("/api/jobs/" + jobId + "/skill-gap/" + candidateId);
}

export function setApplicationStatus(id, status) {
  return sendJson("/api/applications/" + id + "/status", { status });
}

export function getOpenJobs() {
  return request("/api/jobs/open");
}

export function applyToJob(jobId) {
  return request("/api/jobs/" + jobId + "/apply", { method: "POST" });
}

export function getMyApplications() {
  return request("/api/my/applications");
}

export function forgotPassword(email) {
  return sendJson("/api/forgot-password", { email });
}

export function resetPassword(token, password) {
  return sendJson("/api/reset-password", { token, password });
}
