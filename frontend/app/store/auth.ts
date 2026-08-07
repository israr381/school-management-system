import { API_BASE_URL } from "./config";

export async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: password,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || "Authentication failed. Please verify credentials.");
  }
  
  return data;
}

export async function fetchCurrentUser(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || "Session expired. Please log in again.");
  }
  
  return data;
}
