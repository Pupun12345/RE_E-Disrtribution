// src/utils/api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function handleResponse(res: Response, method: string, path: string) {
  if (!res.ok) {
    let message = `${method.toUpperCase()} ${path} failed`;
    try {
      const error = await res.json();
      message = error.message || message;
    } catch (_) {}
    throw new Error(message);
  }
  return res.json();
}

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export const api = {
  async get(path: string) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return handleResponse(res, "GET", path);
  },

  async post(path: string, body: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res, "POST", path);
  },

  async put(path: string, body: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res, "PUT", path);
  },

  async patch(path: string, body: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res, "PATCH", path);
  },

  async delete(path: string) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "DELETE", path);
  },
};
