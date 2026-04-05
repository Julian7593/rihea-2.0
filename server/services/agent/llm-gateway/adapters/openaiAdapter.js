function extractJsonString(content = "") {
  const safe = String(content || "").trim();
  if (!safe) return "";

  const fenceMatch = safe.match(/```json\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  const firstBrace = safe.indexOf("{");
  const lastBrace = safe.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return safe.slice(firstBrace, lastBrace + 1).trim();
  }

  return safe;
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

export function createOpenaiAdapter({ apiKey, baseUrl = "https://api.openai.com/v1" } = {}) {
  const key = String(apiKey || "").trim();
  const endpointBase = String(baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");

  return {
    async completeJson({ model, systemPrompt, userPrompt, timeoutMs = 8000 }) {
      if (!key) {
        return {
          ok: false,
          error: {
            code: "MISSING_API_KEY",
            message: "OPENAI_API_KEY is missing.",
          },
        };
      }

      const timeout = createTimeoutSignal(timeoutMs);
      try {
        const response = await fetch(`${endpointBase}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            messages: [
              { role: "system", content: String(systemPrompt || "") },
              { role: "user", content: String(userPrompt || "") },
            ],
          }),
          signal: timeout.signal,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          return {
            ok: false,
            error: {
              code: `HTTP_${response.status}`,
              message: payload?.error?.message || `OpenAI HTTP ${response.status}`,
            },
          };
        }

        const payload = await response.json();
        const content = payload?.choices?.[0]?.message?.content || "";
        const jsonString = extractJsonString(content);
        const parsed = JSON.parse(jsonString);
        return {
          ok: true,
          data: parsed,
        };
      } catch (error) {
        return {
          ok: false,
          error: {
            code: error?.name === "AbortError" ? "TIMEOUT" : "REQUEST_FAILED",
            message: error?.message || "OpenAI request failed.",
          },
        };
      } finally {
        timeout.clear();
      }
    },
  };
}
