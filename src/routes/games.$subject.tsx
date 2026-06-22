import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Check, GraduationCap, ListChecks, Loader2, Pencil, RotateCcw, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useServerFn } from "@tanstack/react-start";
import { getSubject, checkShortAnswer, type QuizMode, type Question, type Topic } from "@/lib/quiz-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getOrGenerateLesson, type Lesson } from "@/lib/lesson.functions";

export const Route = createFileRoute("/games/$subject")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.subject.toUpperCase()} — Lumen` },
      { name: "description", content: `Learn and test your knowledge in ${params.subject}.` },
    ],
  }),
  component: SubjectPage,
});

type Tab = "learn" | "quiz";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function SubjectPage() {
  const { subject: subjectId } = Route.useParams();
  const subject = getSubject(subjectId);
  const [tab, setTab] = useState<Tab>("learn");

  if (!subject) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <p className="text-muted-foreground">Subject not found.</p>
        <Link to="/games" className="mt-4 text-primary underline">Back to subjects</Link>
      </div>
    );
  }

  return (
    <div className="pb-32 md:pb-0">
      <div className="mx-auto max-w-3xl">
        <Link to="/games" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Subjects
        </Link>
        <div className="glass-panel mt-4 p-6 text-center">
          <div className="text-5xl">{subject.emoji}</div>
          <h1 className="mt-3 font-display text-3xl font-semibold">{subject.name}</h1>
          <p className="mt-2 text-muted-foreground">{subject.blurb}</p>
          <div className="mt-4 inline-flex gap-1 rounded-lg bg-white/5 p-1">
            <button onClick={() => setTab("learn")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${tab === "learn" ? "bg-primary/20 text-foreground" : "text-muted-foreground"}`}>
              <BookOpen className="h-4 w-4" /> Learn
            </button>
            <button onClick={() => setTab("quiz")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${tab === "quiz" ? "bg-primary/20 text-foreground" : "text-muted-foreground"}`}>
              <ListChecks className="h-4 w-4" /> Quiz
            </button>
          </div>
        </div>

        {tab === "learn" ? <LearnTab subject={subject} /> : <QuizTab subject={subject} />}
      </div>
    </div>
  );
}

function LearnTab({ subject }: { subject: ReturnType<typeof getSubject> & {} }) {
  const { profile } = useAuth();
  const generate = useServerFn(getOrGenerateLesson);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [grade, setGrade] = useState<number>(profile?.grade ?? 9);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);

  const open = async (t: Topic, regenerate = false) => {
    setTopic(t); setLoading(true); setLesson(null);
    try {
      const result = await generate({ data: { subject: subject.name, topic: t.name, grade, regenerate } });
      setLesson(result);
    } catch (e) {
      toast.error((e as Error).message);
      setTopic(null);
    } finally { setLoading(false); }
  };

  if (topic) {
    return (
      <div className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => { setTopic(null); setLesson(null); }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Topics
          </button>
          {lesson && (
            <button onClick={() => open(topic, true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">
              <RotateCcw className="h-3.5 w-3.5" /> Regenerate
            </button>
          )}
        </div>
        {loading ? (
          <div className="glass-panel grid place-items-center py-24 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Composing your lesson…</p>
          </div>
        ) : lesson ? (
          <article className="glass-panel space-y-6 p-6">
            <header>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Grade {grade} · {subject.name}</div>
              <h2 className="mt-1 font-display text-2xl font-semibold">{lesson.title}</h2>
            </header>

            <Section title="Objectives">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {lesson.objectives.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </Section>

            {lesson.vocabulary.length > 0 && (
              <Section title="Vocabulary">
                <dl className="grid gap-2 sm:grid-cols-2">
                  {lesson.vocabulary.map((v, i) => (
                    <div key={i} className="rounded-lg border border-border bg-white/5 p-3 text-sm">
                      <dt className="font-medium">{v.term}</dt>
                      <dd className="text-muted-foreground">{v.definition}</dd>
                    </div>
                  ))}
                </dl>
              </Section>
            )}

            {lesson.sections.map((s, i) => (
              <Section key={i} title={s.heading}>
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{s.body}</ReactMarkdown>
                </div>
              </Section>
            ))}

            {lesson.worked_examples.length > 0 && (
              <Section title="Worked examples">
                <div className="space-y-3">
                  {lesson.worked_examples.map((ex, i) => (
                    <div key={i} className="rounded-lg border border-border bg-white/5 p-4 text-sm">
                      <div className="font-medium">Problem: {ex.problem}</div>
                      <div className="mt-2 text-muted-foreground prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{ex.solution}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Self-check">
              <ol className="space-y-2 pl-5 text-sm list-decimal">
                {lesson.self_check.map((c, i) => (
                  <li key={i}>
                    <div>{c.question}</div>
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-primary hover:underline">Show answer</summary>
                      <div className="mt-1 text-muted-foreground">{c.answer}</div>
                    </details>
                  </li>
                ))}
              </ol>
            </Section>

            <p className="rounded-lg border border-border bg-white/5 p-3 text-xs text-muted-foreground">
              AI-generated lesson in the style of mastery-based curricula. Not official Alpha Omega LIFEPAC® content.
            </p>
          </article>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="glass-panel mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2 text-sm">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span>Grade</span>
          <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}
            className="rounded-md border border-border bg-white/5 px-2 py-1 text-sm">
            {[9, 10, 11, 12].map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <p className="text-xs text-muted-foreground">Pick a topic to read an AI-generated lesson.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {subject.topics.map((t) => (
          <button key={t.id} onClick={() => open(t)}
            className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-white/5 p-5 text-left transition hover:border-primary/50 hover:bg-white/10">
            <Sparkles className="h-5 w-5 text-primary" />
            <div className="font-display text-lg font-semibold">{t.name}</div>
            <div className="text-sm text-muted-foreground">{t.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

// ─── Quiz Tab (existing topic → mode → quiz flow) ─────────────────────────
function QuizTab({ subject }: { subject: ReturnType<typeof getSubject> & {} }) {
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

  const questions = useMemo<Question[]>(() => (topic ? shuffle(topic.questions) : []), [topic, seed, mode]);

  if (topic === null) {
    return (
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {subject.topics.map((t) => (
          <button key={t.id} onClick={() => setTopic(t)}
            className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-white/5 p-5 text-left transition hover:border-primary/50 hover:bg-white/10">
            <ListChecks className="h-5 w-5 text-primary" />
            <div className="font-display text-lg font-semibold">{t.name}</div>
            <div className="text-sm text-muted-foreground">{t.blurb}</div>
            <div className="mt-1 text-xs text-muted-foreground">{t.questions.length} questions</div>
          </button>
        ))}
      </div>
    );
  }

  if (mode === null) {
    return (
      <div className="mt-4">
        <button onClick={() => setTopic(null)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Topics
        </button>
        <div className="glass-panel p-6 text-center">
          <h2 className="font-display text-xl font-semibold">{topic.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{topic.blurb}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button onClick={() => setMode("mc")} className="flex flex-col items-start gap-2 rounded-xl border border-border bg-white/5 p-5 text-left hover:border-primary/50 hover:bg-white/10">
              <ListChecks className="h-6 w-6 text-primary" />
              <div className="font-display text-lg font-semibold">Multiple Choice</div>
              <div className="text-sm text-muted-foreground">Pick from four options.</div>
            </button>
            <button onClick={() => setMode("short")} className="flex flex-col items-start gap-2 rounded-xl border border-border bg-white/5 p-5 text-left hover:border-accent/50 hover:bg-white/10">
              <Pencil className="h-6 w-6 text-accent" />
              <div className="font-display text-lg font-semibold">Short Answer</div>
              <div className="text-sm text-muted-foreground">Type your answer.</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const resetQuestion = () => { setPicked(null); setShortInput(""); setShortSubmitted(false); setShortCorrect(false); };
  const choose = (i: number) => { if (picked !== null) return; setPicked(i); if (i === q.answer) setScore((s) => s + 1); };
  const submitShort = () => {
    if (shortSubmitted || !shortInput.trim()) return;
    const ok = checkShortAnswer(q, shortInput);
    setShortSubmitted(true); setShortCorrect(ok); if (ok) setScore((s) => s + 1);
  };
  const answered = mode === "mc" ? picked !== null : shortSubmitted;

  const next = async () => {
    if (idx + 1 < questions.length) { setIdx(idx + 1); resetQuestion(); }
    else {
      setDone(true);
      if (user && !saved) {
        const { error } = await supabase.from("quiz_scores").insert({
          user_id: user.id, subject: `${subject.id}:${topic.id}:${mode}`,
          score, total: questions.length,
        });
        if (error) toast.error("Couldn't save score"); else setSaved(true);
      }
    }
  };

  const restart = () => { setIdx(0); resetQuestion(); setScore(0); setDone(false); setSaved(false); setSeed((s) => s + 1); };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="mt-4 glass-panel p-8 text-center">
        <h1 className="font-display text-3xl font-semibold">Quiz complete!</h1>
        <div className="my-6">
          <div className="font-display text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{score}/{questions.length}</div>
          <div className="mt-1 text-sm text-muted-foreground">{pct}% correct</div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={restart} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <RotateCcw className="h-4 w-4" /> Play again
          </button>
          <button onClick={() => { setMode(null); restart(); }} className="rounded-lg border border-border bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Switch mode</button>
          <button onClick={() => { setTopic(null); setMode(null); restart(); }} className="rounded-lg border border-border bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Switch topic</button>
          <button onClick={() => navigate({ to: "/games" })} className="rounded-lg border border-border bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Subjects</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => { setMode(null); restart(); }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Mode
        </button>
        <div className="text-sm text-muted-foreground"><span className="text-foreground">{idx + 1}</span> / {questions.length} · Score {score}</div>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${((idx + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>
      <div className="glass-panel p-6">
        <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{topic.name} · {mode === "mc" ? "Multiple Choice" : "Short Answer"}</div>
        <h2 className="font-display text-2xl font-semibold">{q.q}</h2>

        {mode === "mc" ? (
          <div className="mt-6 grid gap-2">
            {q.choices.map((c, i) => {
              const chosen = picked === i;
              const showAnswer = picked !== null;
              const correct = i === q.answer;
              return (
                <button key={i} onClick={() => choose(i)} disabled={picked !== null}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
                    showAnswer && correct ? "border-emerald-400/60 bg-emerald-400/10"
                      : showAnswer && chosen && !correct ? "border-rose-400/60 bg-rose-400/10"
                      : "border-border bg-white/5 hover:border-primary/40 hover:bg-white/10"
                  }`}>
                  <span>{c}</span>
                  {showAnswer && correct && <Check className="h-4 w-4 text-emerald-400" />}
                  {showAnswer && chosen && !correct && <X className="h-4 w-4 text-rose-400" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <input type="text" value={shortInput} onChange={(e) => setShortInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { if (!shortSubmitted) submitShort(); else next(); } }}
              disabled={shortSubmitted} placeholder="Type your answer…" autoFocus
              className={`w-full rounded-lg border bg-white/5 px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground/60 ${
                shortSubmitted ? (shortCorrect ? "border-emerald-400/60 bg-emerald-400/10" : "border-rose-400/60 bg-rose-400/10") : "border-border focus:border-primary/60"
              }`} />
            {!shortSubmitted && (
              <button onClick={submitShort} disabled={!shortInput.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Submit</button>
            )}
            {shortSubmitted && !shortCorrect && (
              <p className="text-sm text-muted-foreground">Correct: <span className="text-foreground">{q.choices[q.answer]}</span></p>
            )}
          </div>
        )}

        {answered && (
          <div className="mt-6 flex items-center justify-between">
            <p className={`text-sm ${(mode === "mc" ? picked === q.answer : shortCorrect) ? "text-emerald-400" : "text-rose-400"}`}>
              {(mode === "mc" ? picked === q.answer : shortCorrect) ? "Correct!" : "Not quite."}
            </p>
            <button onClick={next} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {idx + 1 < questions.length ? "Next" : "See results"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
