import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getModel, providerOptions, friendlyAiError } from "@/lib/ai-gateway.server";

const InputSchema = z.object({
  weeklyMinutes: z.number(),
  quizzes: z.number(),
  avgScore: z.number(),
  bySubject: z.array(z.object({ subject: z.string(), avg: z.number(), count: z.number() })),
  grade: z.number().int().min(9).max(12),
});

export const getStudySuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const model = getModel();

    const subjects = data.bySubject
      .map((s) => `${s.subject}: ${Math.round(s.avg * 100)}% over ${s.count} quizzes`)
      .join("; ") || "no quiz data yet";

    const result = streamText({
      model,
      providerOptions,
      prompt: `You are a friendly study coach for a Grade ${data.grade} student. Based on the stats below, write ONE concise paragraph (3-4 sentences) of personalized suggestions. Mention specific subjects to focus on and a concrete next step. Warm tone, no fluff.

Stats:
- Weekly study minutes: ${data.weeklyMinutes}
- Quizzes taken: ${data.quizzes}
- Overall accuracy: ${Math.round(data.avgScore * 100)}%
- By subject: ${subjects}`,
    });
    let text = "";
    try { text = await result.text; } catch (e) { throw friendlyAiError(e); }
    return { suggestion: text.trim() };
  });
