import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Gamepad2 } from "lucide-react";
import { SUBJECTS } from "@/lib/quiz-data";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "Quiz Games — Lumen" },
      { name: "description", content: "Play subject quizzes: Math, English, Science, Social Studies, and Bible." },
    ],
  }),
  component: GamesIndex,
});

function GamesIndex() {
  return (
    <div className="pb-24 md:pb-0">
      <section className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          <Gamepad2 className="h-4 w-4" /> Quiz Arcade
        </div>
        <h1 className="font-display text-4xl font-semibold md:text-5xl">
          Pick a <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">subject</span>
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Quick-fire quizzes to keep your brain sharp between study sessions.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.map((s) => (
          <Link
            key={s.id}
            to="/games/$subject"
            params={{ subject: s.id }}
            className="glass-panel group relative overflow-hidden p-6 transition hover:border-primary/40"
          >
            <div className="flex items-start justify-between">
              <div className="text-4xl">{s.emoji}</div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">{s.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.blurb}</p>
            <p className="mt-3 text-xs text-muted-foreground">{s.questions.length} questions</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
