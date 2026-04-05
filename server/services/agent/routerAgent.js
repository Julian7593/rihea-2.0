import { createIntentClassifier } from "./intents/intentClassifier.js";
import { buildRouterPromptInput } from "./prompts/routerPrompt.js";

export function createRouterAgent({ intentClassifier = createIntentClassifier() } = {}) {
  return {
    async route({
      requestId,
      userId,
      sessionId,
      message,
      lang,
      precheck,
      clientContext = {},
      memoryPromptContext = null,
      routerCapabilities = {},
    }) {
      const promptInput = buildRouterPromptInput({
        requestId,
        userId,
        sessionId,
        message,
        lang,
        precheck,
        memoryPromptContext,
        clientContext,
        routerCapabilities,
      });
      const routed = await intentClassifier.classify({
        message,
        lang,
        precheck,
        routerCapabilities,
        modelPreference:
          clientContext?.modelPreference && typeof clientContext.modelPreference === "object"
            ? clientContext.modelPreference
            : null,
      });

      return {
        ...routed,
        promptInput: {
          systemPrompt: promptInput.systemPrompt,
          taskInput: {
            ...promptInput.taskInput,
            memoryContext: Array.isArray(memoryPromptContext?.slots)
              ? promptInput.taskInput.memoryContext
              : [],
          },
        },
      };
    },
  };
}
