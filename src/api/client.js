const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim();

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

  const response = await fetch(`${API_BASE_URL}${contract.path}`, {
    method: contract.method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

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
