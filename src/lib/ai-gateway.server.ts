import { createOpenAI } from "@ai-sdk/openai";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";
export const AI_MODEL = "openai/gpt-6-astra";

export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    getRunId: () => runId,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
      return response;
    },
  };
}

/** Returns a Responses-API model bound to the Lovable AI Gateway. Create per request. */
export function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured (missing key).");
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const openai = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch as typeof fetch,
  });
  return openai.responses(AI_MODEL);
}

export const providerOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

export function friendlyAiError(e: unknown): Error {
  const msg = (e as { statusCode?: number; message?: string }) ?? {};
  if (msg.statusCode === 429) return new Error("AI is busy right now — please try again in a moment.");
  if (msg.statusCode === 402) return new Error("AI credits are used up for this workspace.");
  return new Error(msg.message || "AI request failed");
}
