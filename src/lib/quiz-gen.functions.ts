import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const QuestionSchema = z.object({
  q: z.string(),
  type: z.enum(["mc", "tf", "short"]),
  choices: z.array(z.string()).default([]),
  answer: z.string(),
  explanation: z.string().default(""),
});

const QuizSchema = z.object({
  title: z.string(),
  questions: z.array(QuestionSchema).min(1).max(20),
});

export type GeneratedQuiz = z.infer<typeof QuizSchema>;

const InputSchema = z.object({
  text: z.string().min(20).max(15000),
  count: z.number().int().min(3).max(15),
  types: z.array(z.enum(["mc", "tf", "short"])).min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topicHint: z.string().optional(),
});

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const allowed = data.types.join(", ");
    const prompt = `Generate a study quiz from the source material below.

Rules:
- Exactly ${data.count} questions.
- Difficulty: ${data.difficulty}.
- Allowed question types: ${allowed}.
  - "mc" = multiple choice with EXACTLY 4 choices; "answer" must match one of "choices" verbatim.
  - "tf" = true/false; "choices" = ["True","False"]; "answer" = "True" or "False".
  - "short" = short answer; "choices" = []; "answer" is the canonical answer (1–6 words).
- Each question must include a one-sentence "explanation".
- Title should be a short topic name.
${data.topicHint ? `- Topic hint: ${data.topicHint}` : ""}

Source material:
"""
${data.text}
"""`;

    const { experimental_output } = await generateText({
      model,
      prompt,
      experimental_output: Output.object({ schema: QuizSchema }),
    });
    return experimental_output;
  });
