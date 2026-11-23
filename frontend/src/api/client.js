const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export function getStoredToken() {
  return localStorage.getItem("mindmate_token") || "";
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem("mindmate_token", token);
  } else {
    localStorage.removeItem("mindmate_token");
  }
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail.map((d) => d.msg).join(", ");
      }
    } catch {
      // Fallback to status text
      message = response.statusText || message;
    }
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response;
}

export const api = {
  // Health & Privacy
  health: () => request("/api/health"),
  privacySummary: () => request("/api/privacy/summary"),
  deleteAllMyData: () => request("/api/privacy/delete-my-data", { method: "DELETE" }),

  // Auth
  signup: (payload) =>
    request("/api/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  demoLogin: (role = "student") =>
    request("/api/auth/demo", { method: "POST", body: JSON.stringify({ role }) }),
  me: () => request("/api/auth/me"),

  // Pet
  getPet: () => request("/api/pet"),
  updatePet: (payload) =>
    request("/api/pet", { method: "PUT", body: JSON.stringify(payload) }),
  interactPet: (action) =>
    request("/api/pet/interact", { method: "POST", body: JSON.stringify({ action }) }),
  downloadPetBadge: async () => {
    const res = await request("/api/pet/badge");
    return res.blob();
  },

  // Mood
  recordMood: (payload) =>
    request("/api/mood", { method: "POST", body: JSON.stringify(payload) }),
  getMoodHistory: (limit = 30) => request(`/api/mood/history?limit=${limit}`),
  deleteMoodEntry: (id) => request(`/api/mood/${id}`, { method: "DELETE" }),
  clearMoodHistory: () => request("/api/mood/history", { method: "DELETE" }),

  // Wellness Activities
  getActivities: (category = "") =>
    request(`/api/wellness/activities${category ? `?category=${encodeURIComponent(category)}` : ""}`),
  completeActivity: (payload) =>
    request("/api/wellness/complete", { method: "POST", body: JSON.stringify(payload) }),
  getWellnessProgress: () => request("/api/wellness/progress"),

  // Chatbot
  sendChat: (payload) =>
    request("/api/chat", { method: "POST", body: JSON.stringify(payload) }),
  getChatHistory: () => request("/api/chat/history"),
  clearChatHistory: () => request("/api/chat/history", { method: "DELETE" }),

  // Documents / RAG (Admin)
  getDocuments: () => request("/api/documents"),
  uploadDocument: (formData, adminCode = "") =>
    request("/api/documents/upload", {
      method: "POST",
      body: formData,
      headers: adminCode ? { "X-Admin-Code": adminCode } : {},
    }),
  seedStarterDocs: (adminCode = "") =>
    request("/api/documents/seed", {
      method: "POST",
      headers: adminCode ? { "X-Admin-Code": adminCode } : {},
    }),
  searchDocuments: (query, top_k = 4) =>
    request("/api/documents/search", {
      method: "POST",
      body: JSON.stringify({ query, top_k }),
    }),
  deleteDocument: (docId, adminCode = "") =>
    request(`/api/documents/${docId}`, {
      method: "DELETE",
      headers: adminCode ? { "X-Admin-Code": adminCode } : {},
    }),
};

