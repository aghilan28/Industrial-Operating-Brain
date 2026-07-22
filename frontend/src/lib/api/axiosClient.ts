const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ApiResponse<T = any> {
  data: T;
  status: number;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("iob_access_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("iob_access_token");
    localStorage.removeItem("iob_user_data");
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }

  let data: any;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const error: any = new Error(`HTTP error ${response.status}`);
    error.response = { status: response.status, data };
    throw error;
  }

  return { data, status: response.status };
}

export const api = {
  get: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "GET", headers }),

  post: <T = any>(endpoint: string, body?: any, options: { headers?: Record<string, string> } = {}) => {
    let reqBody: any = body;
    const headers: Record<string, string> = { ...options.headers };

    if (body && !(body instanceof URLSearchParams) && typeof body === "object") {
      reqBody = JSON.stringify(body);
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
    } else if (body instanceof URLSearchParams) {
      reqBody = body.toString();
    }

    return request<T>(endpoint, {
      method: "POST",
      headers,
      body: reqBody,
    });
  },
};
