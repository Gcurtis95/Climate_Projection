export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

type FetchJsonOptions = RequestInit & { timeoutMs?: number };

export async function fetchJson<T>(
  url: string,
  { timeoutMs = 15000, ...init }: FetchJsonOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new HttpError(
        response.status,
        body || `Request to ${url} failed with status ${response.status}`
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new HttpError(504, `Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw new HttpError(502, error instanceof Error ? error.message : "Unknown fetch error");
  } finally {
    clearTimeout(timeout);
  }
}
