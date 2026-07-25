/*
AUDIT FINDINGS:
A) Components existing: client/src/App.jsx (Login Component)
B) API calls wired: None.
C) Firebase Auth initialised: No.
D) Import paths: None yet, but generic Vite+React structure with Tailwind applies.
*/

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
});

api.interceptors.request.use(
  async (config) => {
    // Assuming firebase auth state holds currentUser
    // You need to import firebase/auth and get the current user here
    // For demonstration, reading from localStorage or checking a global object
    const token = localStorage.getItem("fb_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(error);
  },
);

// Auth Routes
export async function syncAuth() {
  return api.post("/auth/sync");
}
export async function getProfile() {
  return api.get("/users/profile");
}
export async function updateProfile(data) {
  return api.put("/users/profile", data);
}

// Resume Routes
export async function uploadResume(formData) {
  return api.post("/resumes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
export async function getResumes() {
  return api.get("/resumes");
}
export async function getResume(id) {
  return api.get(`/resumes/${id}`);
}
export async function getResumeStatus(id) {
  return api.get(`/resumes/${id}/status`);
}
export async function deleteResume(id) {
  return api.delete(`/resumes/${id}`);
}

// AI Routes
export async function computeMatch(data) {
  return api.post("/ai/match", data, { timeout: 60000 });
}
export async function generateCoverLetter(data) {
  return api.post("/ai/cover-letter", data, { timeout: 60000 });
}
export async function generateInterviewPrep(data) {
  return api.post("/ai/interview-prep", data, { timeout: 60000 });
}
export async function getAiJobStatus(jobId) {
  return api.get(`/ai/status/${jobId}`);
}
export async function triggerAnalytics() {
  return api.post("/ai/analytics", {}, { timeout: 60000 });
}
export async function getAnalytics() {
  return api.get("/ai/analytics");
}

// Application Routes
export async function getApplications() {
  return api.get("/applications");
}
export async function getInterviewNotes(appId) {
  return api.get(`/applications/${appId}/interview`);
}

export default api;
