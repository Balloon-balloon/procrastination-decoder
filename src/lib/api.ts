const BASE_PATH = process.env.NODE_ENV === "production" ? "/procrastination-decoder" : "";

export function apiUrl(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), init);
  const data = await response.json().catch(() => ({ message: "服务返回了无效响应" }));
  if (!response.ok && typeof data === "object" && data) {
    return data as T;
  }
  return data as T;
}
