import { createServerFn } from "@tanstack/react-start";
import { streamText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getModel, providerOptions, friendlyAiError } from "@/lib/ai-gateway.server";

const LessonSchema = z.object({
  title: z.string(),
  objectives: z.array(z.string()),
  vocabulary: z.array(z.object({ term: z.string(), definition: z.string() })),
  sections: z.array(z.object({
    heading: z.string(),
    body: z.string(),
  })),
  worked_examples: z.array(z.object({
    problem: z.string(),
    solution: z.string(),
  })),
  self_check: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
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

    const model = getModel();

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

    let experimental_output;
      try {
        const result = streamText({ model, prompt, providerOptions, output: Output.object({ schema: LessonSchema }) });
        experimental_output = await result.output;
      } catch (e) { throw friendlyAiError(e); }

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
