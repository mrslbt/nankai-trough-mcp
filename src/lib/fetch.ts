/** Fetch with a hard timeout. Throws on non-OK so callers can try/catch into an MCP error. */
export async function safeFetch(url: string, options?: RequestInit, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { "User-Agent": "nankai-trough-mcp (+https://github.com/mrslbt/nankai-trough-mcp)", ...(options?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}
