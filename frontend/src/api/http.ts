const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

type RequestOptions = {
  token?: string;
  body?: unknown;
};

async function apiRequest<TResponse>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  options: RequestOptions = {},
): Promise<TResponse> {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(errorBody?.message || "Erro ao consultar o sistema");
  }

  return response.json() as Promise<TResponse>;
}

export function apiGet<TResponse>(path: string, options?: RequestOptions): Promise<TResponse> {
  return apiRequest<TResponse>(path, "GET", options);
}

export function apiPost<TResponse>(path: string, body: unknown, token?: string): Promise<TResponse> {
  return apiRequest<TResponse>(path, "POST", { body, token });
}

export function apiPatch<TResponse>(
  path: string,
  body: unknown,
  token?: string,
): Promise<TResponse> {
  return apiRequest<TResponse>(path, "PATCH", { body, token });
}
