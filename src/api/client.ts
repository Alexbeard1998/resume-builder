import { ApiError } from "./ApiError";
const API_URL = "http://localhost:3001/api";

const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");

async function handleResponse(res: Response) {
  if (!res.ok) {
    let errorMessage = `Ошибка ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Не JSON
    }

    throw new ApiError(errorMessage, res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error("Нет refresh token");

      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await handleResponse(res);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      return data.accessToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Обёртка для fetch с автоматическим обновлением
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let accessToken = getAccessToken();

  const makeRequest = (token: string | null) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  };

  // Первая попытка
  let res = await makeRequest(accessToken);

  // Если 401 — пробуем обновить токен
  if (res.status === 401) {
    try {
      accessToken = await refreshAccessToken();
      res = await makeRequest(accessToken);
    } catch (error) {
      // Если не удалось обновить — выходим
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      throw new Error("Сессия истекла", { cause: error });
    }
  }

  return res;
}

export const api = {
  async register(
    email: string,
    password: string,
    name: string,
    username: string,
  ) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, username }),
    });
    return handleResponse(res);
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async getResumes() {
    const res = await fetchWithAuth(`${API_URL}/resumes`);
    return handleResponse(res);
  },

  async getResumeById(id: string) {
    const res = await fetchWithAuth(`${API_URL}/resumes/${id}`);
    return handleResponse(res);
  },

  async createResume(data: any) {
    const res = await fetchWithAuth(`${API_URL}/resumes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateResume(id: string, data: any) {
    const res = await fetchWithAuth(`${API_URL}/resumes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteResume(id: string) {
    const res = await fetchWithAuth(`${API_URL}/resumes/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },

  async publishResume(id: string, status: "draft" | "published" | "public") {
    const res = await fetchWithAuth(`${API_URL}/resumes/${id}/publish`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  async getPublicResumes() {
    const res = await fetch(`${API_URL}/public/resumes`);
    return handleResponse(res);
  },

  async getPublicResume(username: string) {
    const res = await fetch(`${API_URL}/public/resume/${username}`);
    return handleResponse(res);
  },
};
