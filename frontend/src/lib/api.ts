import Cookies from "js-cookie";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = Cookies.get("auth_token");
  
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // Default to application/json if not explicitly set and not sending FormData
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    // If unauthorized, could potentially force logout here
    // but the AuthContext or component will handle redirects usually.
  }

  return response;
}
