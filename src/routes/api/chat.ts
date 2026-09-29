import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { getModel, providerOptions } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are Lumen, a warm, patient AI study tutor for high schoolers (grades 9–12).
- Explain concepts simply with concrete examples and step-by-step reasoning.
- For math, show work line by line.
- Keep answers focused and structured. Use markdown: headings, bullets, and code blocks when helpful.
- If a student pastes notes, summarize the key ideas crisply.
- If asked to "quiz me", produce 3–5 clean questions with answers hidden under "Answer:" lines.
- Encourage curiosity, never condescend.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth check via bearer token
        const auth = request.headers.get("authorization");
        const token = auth?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        const { data: userData, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userData.user) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages required", { status: 400 });
        }

        if (!process.env.LOVABLE_API_KEY) return new Response("AI is not configured", { status: 500 });
        const model = getModel();

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          providerOptions,
          messages: await convertToModelMessages(body.messages),
          abortSignal: request.signal,
        });

        return result.toUIMessageStreamResponse({
          onError: (e) => {
            const err = e as { statusCode?: number; message?: string };
            if (err?.statusCode === 429) return "AI is busy — try again in a moment.";
            if (err?.statusCode === 402) return "AI credits are used up for this workspace.";
            return err?.message || "AI error";
          },
        });
      },
    },
  },
});
