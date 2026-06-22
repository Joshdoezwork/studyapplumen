import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const LessonSchema = z.object({
  title: z.string(),
  objectives: z.array(z.string()).min(2).max(6),
  vocabulary: z.array(z.object({ term: z.string(), definition: z.string() })).max(10),
  sections: z.array(z.object({
    heading: z.string(),
    body: z.string(),
  })).min(2).max(6),
  worked_examples: z.array(z.object({
    problem: z.string(),
    solution: z.string(),
  })).max(4),
  self_check: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).min(3).max(8),
});

export type Lesson = z.infer<typeof LessonSchema>;

const InputSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().min(1),
  grade: z.number().int().min(9).max(12),
  regenerate: z.boolean().default(false),
});

export const getOrGenerateLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!data.regenerate) {
      const { data: cached } = await context.supabase
        .from("generated_lessons")
        .select("content_json")
        .eq("user_id", context.userId)
        .eq("subject", data.subject)
        .eq("topic", data.topic)
        .eq("grade", data.grade)
        .maybeSingle();
      if (cached?.content_json) return cached.content_json as Lesson;
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const prompt = `Write a mastery-based, self-paced lesson for a Grade ${data.grade} student.
Subject: ${data.subject}
Topic: ${data.topic}

Style:
- Clear, encouraging, age-appropriate.
- Mastery-based / self-paced curriculum style (think classic Christian-school workbook units): learning objectives, vocabulary, short readings with examples, worked problems, and a self-check.
- Use plain markdown-friendly text in "body" and "solution" fields (no HTML).
- Math should be readable plain text (use ^ for exponents, * for multiplication, / for fractions when needed).
- Each section's "body" is 80–200 words.

Return strictly the JSON schema fields requested.`;

    const { experimental_output } = await generateText({
      model,
      prompt,
      experimental_output: Output.object({ schema: LessonSchema }),
    });

    await context.supabase
      .from("generated_lessons")
      .upsert({
        user_id: context.userId,
        subject: data.subject,
        topic: data.topic,
        grade: data.grade,
        content_json: experimental_output as never,
      }, { onConflict: "user_id,subject,topic,grade" });

    return experimental_output;
  });
