import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const logStudySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ minutes: z.number().int().min(1).max(240), source: z.string().default("pomodoro") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("study_sessions").insert({
      user_id: context.userId,
      minutes: data.minutes,
      source: data.source,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
