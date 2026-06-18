import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, RotateCcw, X, ListChecks, Pencil, BookMarked } from "lucide-react";
import { toast } from "sonner";
import { getSubject, checkShortAnswer, type QuizMode, type Question, type Topic } from "@/lib/quiz-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/games/$subject")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.subject.toUpperCase()} Quiz — Lumen` },
      { name: "description", content: `Test your knowledge in ${params.subject}.` },
    ],
  }),
  component: QuizPage,
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function QuizPage() {
  const { subject: subjectId } = Route.useParams();
  const subject = getSubject(subjectId);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [seed, setSeed] = useState(0);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [shortInput, setShortInput] = useState("");
  const [shortSubmitted, setShortSubmitted] = useState(false);
  const [shortCorrect, setShortCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);

  const questions = useMemo<Question[]>(
    () => (topic ? shuffle(topic.questions) : []),
    [topic, seed, mode],
  );

  if (!subject) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <p className="text-muted-foreground">Subject not found.</p>
        <Link to="/games" className="mt-4 text-primary underline">Back to subjects</Link>
      </div>
    );
  }

  // 1) Topic selection
  if (topic === null) {
    return (
      <div className="pb-24 md:pb-0">
        <div className="mx-auto max-w-2xl">
          <Link to="/games" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Subjects
          </Link>
          <div className="glass-panel mt-4 p-8 text-center">
            <div className="text-5xl">{subject.emoji}</div>
            <h1 className="mt-3 font-display text-3xl font-semibold">{subject.name}</h1>
            <p className="mt-2 text-muted-foreground">{subject.blurb}</p>
            <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">Pick a topic</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {subject.topics.map((t) => (
              <button
                key={t.id}
                onClick={() => setTopic(t)}
                className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-white/5 p-5 text-left transition hover:border-primary/50 hover:bg-white/10"
              >
                <BookMarked className="h-5 w-5 text-primary" />
                <div className="font-display text-lg font-semibold">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.blurb}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t.questions.length} questions</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2) Mode selection
  if (mode === null) {
    return (
      <div className="pb-24 md:pb-0">
        <div className="mx-auto max-w-2xl">
          <button onClick={() => setTopic(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Topics
          </button>
          <div className="glass-panel mt-4 p-8 text-center">
            <div className="text-5xl">{subject.emoji}</div>
            <h1 className="mt-3 font-display text-3xl font-semibold">{subject.name} · {topic.name}</h1>
            <p className="mt-2 text-muted-foreground">{topic.blurb}</p>
            <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">Choose a mode</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setMode("mc")}
                className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-white/5 p-5 text-left transition hover:border-primary/50 hover:bg-white/10"
              >
                <ListChecks className="h-6 w-6 text-primary" />
                <div className="font-display text-lg font-semibold">Multiple Choice</div>
                <div className="text-sm text-muted-foreground">Pick from four options. Great for quick review.</div>
              </button>
              <button
                onClick={() => setMode("short")}
                className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-white/5 p-5 text-left transition hover:border-accent/50 hover:bg-white/10"
              >
                <Pencil className="h-6 w-6 text-accent" />
                <div className="font-display text-lg font-semibold">Short Answer</div>
                <div className="text-sm text-muted-foreground">Type your answer. Tests true recall.</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[idx];

  const resetQuestion = () => {
    setPicked(null);
    setShortInput("");
    setShortSubmitted(false);
    setShortCorrect(false);
  };

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const submitShort = () => {
    if (shortSubmitted || !shortInput.trim()) return;
    const ok = checkShortAnswer(q, shortInput);
    setShortSubmitted(true);
    setShortCorrect(ok);
    if (ok) setScore((s) => s + 1);
  };

  const answered = mode === "mc" ? picked !== null : shortSubmitted;

  const next = async () => {
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      resetQuestion();
    } else {
      setDone(true);
      if (user && !saved) {
        const { error } = await supabase.from("quiz_scores").insert({
          user_id: user.id,
          subject: `${subject.id}:${topic.id}:${mode}`,
          score,
          total: questions.length,
        });
        if (error) toast.error("Couldn't save score");
        else setSaved(true);
      }
    }
  };

  const restart = () => {
    setIdx(0);
    resetQuestion();
    setScore(0);
    setDone(false);
    setSaved(false);
    setSeed((s) => s + 1);
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="pb-24 md:pb-0">
        <div className="glass-panel mx-auto max-w-xl p-8 text-center">
          <div className="text-5xl">{subject.emoji}</div>
          <h1 className="mt-4 font-display text-3xl font-semibold">Quiz complete!</h1>
          <p className="mt-2 text-muted-foreground">
            {subject.name} · {topic.name} · {mode === "mc" ? "Multiple Choice" : "Short Answer"}
          </p>
          <div className="my-6">
            <div className="font-display text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {score}/{questions.length}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{pct}% correct</div>
          </div>
          <p className="text-sm text-muted-foreground">
            {pct === 100 ? "Perfect score! Constellation-tier." : pct >= 70 ? "Strong work — keep going." : "Good try. Run it back and climb."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={restart} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <RotateCcw className="h-4 w-4" /> Play again
            </button>
            <button
              onClick={() => { setMode(null); restart(); }}
              className="rounded-lg border border-border bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
            >
              Switch mode
            </button>
            <button
              onClick={() => { setTopic(null); setMode(null); restart(); }}
              className="rounded-lg border border-border bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
            >
              Switch topic
            </button>
            <button onClick={() => navigate({ to: "/games" })} className="rounded-lg border border-border bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10">
              Choose subject
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-0">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => { setMode(null); restart(); }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Mode
          </button>
          <div className="text-sm text-muted-foreground">
            <span className="text-foreground">{idx + 1}</span> / {questions.length} · Score {score}
          </div>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: `${((idx + (answered ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>

        <div className="glass-panel p-6 md:p-8">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-2"><span className="text-base">{subject.emoji}</span> {subject.name} · {topic.name}</span>
            <span className="flex items-center gap-1">
              {mode === "mc" ? <ListChecks className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
              {mode === "mc" ? "Multiple Choice" : "Short Answer"}
            </span>
          </div>
          <h2 className="font-display text-2xl font-semibold md:text-3xl">{q.q}</h2>

          {mode === "mc" ? (
            <div className="mt-6 grid gap-2">
              {q.choices.map((c, i) => {
                const chosen = picked === i;
                const showAnswer = picked !== null;
                const correct = i === q.answer;
                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    disabled={picked !== null}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
                      showAnswer && correct
                        ? "border-emerald-400/60 bg-emerald-400/10"
                        : showAnswer && chosen && !correct
                        ? "border-rose-400/60 bg-rose-400/10"
                        : "border-border bg-white/5 hover:border-primary/40 hover:bg-white/10"
                    }`}
                  >
                    <span>{c}</span>
                    {showAnswer && correct && <Check className="h-4 w-4 text-emerald-400" />}
                    {showAnswer && chosen && !correct && <X className="h-4 w-4 text-rose-400" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <input
                type="text"
                value={shortInput}
                onChange={(e) => setShortInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (!shortSubmitted) submitShort();
                    else next();
                  }
                }}
                disabled={shortSubmitted}
                placeholder="Type your answer…"
                autoFocus
                className={`w-full rounded-lg border bg-white/5 px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground/60 ${
                  shortSubmitted
                    ? shortCorrect
                      ? "border-emerald-400/60 bg-emerald-400/10"
                      : "border-rose-400/60 bg-rose-400/10"
                    : "border-border focus:border-primary/60"
                }`}
              />
              {!shortSubmitted && (
                <button
                  onClick={submitShort}
                  disabled={!shortInput.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Submit answer
                </button>
              )}
              {shortSubmitted && !shortCorrect && (
                <p className="text-sm text-muted-foreground">
                  Correct answer: <span className="text-foreground">{q.choices[q.answer]}</span>
                </p>
              )}
            </div>
          )}

          {answered && (
            <div className="mt-6 flex items-center justify-between">
              <p className={`text-sm ${
                (mode === "mc" ? picked === q.answer : shortCorrect)
                  ? "text-emerald-400" : "text-rose-400"
              }`}>
                {(mode === "mc" ? picked === q.answer : shortCorrect) ? "Correct!" : "Not quite."}
              </p>
              <button onClick={next} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                {idx + 1 < questions.length ? "Next question" : "See results"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
