const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim();
<<<<<<< HEAD
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 10000;
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a

export const hasRemoteApi = Boolean(API_BASE_URL);

const isApiEnvelope = (payload) =>
  Boolean(
    payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      "data" in payload &&
      ("code" in payload || "message" in payload || "requestId" in payload)
  );

const getErrorMessage = (payload, status) =>
  payload?.message ||
  payload?.error?.message ||
  payload?.errorMessage ||
  `API request failed: ${status}`;

export async function apiRequest(contract, { body, signal } = {}) {
  if (!hasRemoteApi) {
    throw new Error("Remote API is not configured. Set VITE_API_BASE_URL.");
  }

<<<<<<< HEAD
  const timeoutController = new AbortController();
  const timeoutId =
    API_TIMEOUT_MS > 0
      ? setTimeout(() => {
          timeoutController.abort(new Error("API request timeout"));
        }, API_TIMEOUT_MS)
      : null;
  const onAbort = () => timeoutController.abort(new Error("API request aborted"));

  if (signal) {
    if (signal.aborted) {
      onAbort();
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${contract.path}`, {
      method: contract.method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: timeoutController.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError" || String(error?.message || "").includes("timeout")) {
      throw new Error(`API request timeout after ${API_TIMEOUT_MS}ms`);
    }
    throw new Error(`Unable to connect to API: ${error?.message || "network error"}`);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (signal) {
      signal.removeEventListener("abort", onAbort);
    }
  }
=======
  const response = await fetch(`${API_BASE_URL}${contract.path}`, {
    method: contract.method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = getErrorMessage(payload, response.status);
    throw new Error(message);
  }

  if (isApiEnvelope(payload)) {
    return payload.data;
  }

  return payload;
}
