import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, ListChecks, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { generateQuiz, type GeneratedQuiz } from "@/lib/quiz-gen.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useLocalStorage } from "@/lib/use-local-storage";

export const Route = createFileRoute("/quiz-generator")({
  head: () => ({
    meta: [
      { title: "Quiz Generator — Lumen" },
      { name: "description", content: "Generate quizzes from your notes or any text." },
    ],
  }),
  component: QuizGeneratorPage,
});

type Note = { id: string; title: string; body: string };
type Mode = "input" | "quiz" | "result";

const norm = (s: string) =>
  s.toLowerCase().trim().replace(/[.,!?;:'"`]/g, "").replace(/\s+/g, " ");

function QuizGeneratorPage() {
  const { user } = useAuth();
  const gen = useServerFn(generateQuiz);
  const [notes] = useLocalStorage<Note[]>("lumen.notes", []);

  const [text, setText] = useState("");
  const [topicHint, setTopicHint] = useState("");
  const [count, setCount] = useState(5);
  const [types, setTypes] = useState<("mc" | "tf" | "short")[]>(["mc"]);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [busy, setBusy] = useState(false);

  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [mode, setMode] = useState<Mode>("input");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [input, setInput] = useState("");

  const toggleType = (t: "mc" | "tf" | "short") => {
    setTypes((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]);
  };

  const useNote = (n: Note) => {
    setText(`${n.title}\n\n${n.body}`);
    setTopicHint(n.title);
  };

  const run = async () => {
    if (text.trim().length < 20) { toast.error("Add more source text (at least 20 chars)."); return; }
    if (types.length === 0) { toast.error("Pick at least one question type."); return; }
    setBusy(true);
    try {
      const result = await gen({ data: { text, count, types, difficulty, topicHint: topicHint || undefined } });
      setQuiz(result);
      setIdx(0); setAnswers([]); setRevealed(false); setInput("");
      setMode("quiz");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const q = quiz?.questions[idx];

  const check = (ans: string): boolean => {
    if (!q) return false;
    return norm(ans) === norm(q.answer);
  };

  const submit = (ans: string) => {
    if (revealed || !q) return;
    const next = [...answers]; next[idx] = ans; setAnswers(next);
    setRevealed(true);
  };

  const next = async () => {
    if (!quiz) return;
    if (idx + 1 < quiz.questions.length) {
      setIdx(idx + 1); setRevealed(false); setInput("");
    } else {
      // Compute score, save
      const score = quiz.questions.reduce((s, q, i) => s + (check(answers[i] ?? "") ? 1 : 0), 0);
      if (user) {
        await supabase.from("quiz_scores").insert({
          user_id: user.id,
          subject: `generated:${(topicHint || "custom").slice(0, 40)}`,
          score, total: quiz.questions.length,
        });
      }
      setMode("result");
    }
  };

  if (mode === "result" && quiz) {
    const score = quiz.questions.reduce((s, q, i) => s + (check(answers[i] ?? "") ? 1 : 0), 0);
    const pct = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="pb-32 md:pb-0">
        <div className="glass-panel mx-auto max-w-2xl p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-3 font-display text-3xl font-semibold">{quiz.title}</h1>
          <div className="my-6">
            <div className="font-display text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{score}/{quiz.questions.length}</div>
            <div className="mt-1 text-sm text-muted-foreground">{pct}% correct</div>
          </div>
          <div className="space-y-3 text-left">
            {quiz.questions.map((qq, i) => {
              const ok = check(answers[i] ?? "");
              return (
                <div key={i} className="rounded-lg border border-border bg-white/5 p-3 text-sm">
                  <div className="flex items-start gap-2">
                    {ok ? <Check className="h-4 w-4 shrink-0 text-emerald-400" /> : <X className="h-4 w-4 shrink-0 text-rose-400" />}
                    <div className="flex-1">
                      <div className="font-medium">{i + 1}. {qq.q}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Your answer: <span className="text-foreground">{answers[i] ?? "—"}</span></div>
                      {!ok && <div className="text-xs text-muted-foreground">Correct: <span className="text-emerald-300">{qq.answer}</span></div>}
                      {qq.explanation && <div className="mt-1 text-xs text-muted-foreground/80">{qq.explanation}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={() => { setMode("quiz"); setIdx(0); setAnswers([]); setRevealed(false); setInput(""); }}
              className="rounded-lg border border-border bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Retry</button>
            <button onClick={() => setMode("input")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">New quiz</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "quiz" && quiz && q) {
    return (
      <div className="pb-32 md:pb-0">
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
            <button onClick={() => setMode("input")} className="hover:text-foreground">← New quiz</button>
            <span><span className="text-foreground">{idx + 1}</span> / {quiz.questions.length}</span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${((idx + (revealed ? 1 : 0)) / quiz.questions.length) * 100}%` }} />
          </div>
          <div className="glass-panel p-6">
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{quiz.title}</div>
            <h2 className="font-display text-2xl font-semibold">{q.q}</h2>

            {q.type === "mc" || q.type === "tf" ? (
              <div className="mt-5 grid gap-2">
                {q.choices.map((c, i) => {
                  const chosen = answers[idx] === c;
                  const correct = c === q.answer;
                  return (
                    <button key={i} disabled={revealed} onClick={() => submit(c)}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
                        revealed && correct ? "border-emerald-400/60 bg-emerald-400/10"
                          : revealed && chosen && !correct ? "border-rose-400/60 bg-rose-400/10"
                          : "border-border bg-white/5 hover:border-primary/40 hover:bg-white/10"
                      }`}>
                      <span>{c}</span>
                      {revealed && correct && <Check className="h-4 w-4 text-emerald-400" />}
                      {revealed && chosen && !correct && <X className="h-4 w-4 text-rose-400" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { if (!revealed) submit(input); else next(); } }}
                  disabled={revealed} placeholder="Type your answer…" autoFocus
                  className={`w-full rounded-lg border bg-white/5 px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground/60 ${
                    revealed ? (check(input) ? "border-emerald-400/60 bg-emerald-400/10" : "border-rose-400/60 bg-rose-400/10") : "border-border focus:border-primary/60"
                  }`} />
                {!revealed && (
                  <button onClick={() => submit(input)} disabled={!input.trim()}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                    Submit
                  </button>
                )}
                {revealed && !check(input) && (
                  <p className="text-sm text-muted-foreground">Correct: <span className="text-foreground">{q.answer}</span></p>
                )}
              </div>
            )}

            {revealed && (
              <div className="mt-5 space-y-3">
                {q.explanation && <p className="text-xs text-muted-foreground">{q.explanation}</p>}
                <div className="flex justify-end">
                  <button onClick={next} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    {idx + 1 < quiz.questions.length ? "Next" : "See results"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 md:pb-0">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          <ListChecks className="h-4 w-4" /> Quiz Generator
        </div>
        <h1 className="mt-1 font-display text-3xl font-semibold md:text-4xl">Turn anything into a quiz</h1>
        <p className="mt-2 text-sm text-muted-foreground">Paste notes, a chapter, or any text. AI builds a clean practice quiz.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="glass-panel p-5">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Source text</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10}
              placeholder="Paste notes, chapter text, or topic background here…"
              className="w-full resize-none rounded-lg border border-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Topic name (optional)</span>
            <input value={topicHint} onChange={(e) => setTopicHint(e.target.value)} placeholder="e.g. Photosynthesis"
              className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </label>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground"># Questions</span>
              <select value={count} onChange={(e) => setCount(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm">
                {[3, 5, 10, 15].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Difficulty</span>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <div>
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Types</span>
              <div className="flex gap-1">
                {(["mc", "tf", "short"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => toggleType(t)}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-xs ${types.includes(t) ? "border-primary bg-primary/20" : "border-border bg-white/5 text-muted-foreground"}`}>
                    {t === "mc" ? "MC" : t === "tf" ? "T/F" : "Short"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={run} disabled={busy}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Generating…" : "Generate quiz"}
          </button>
        </div>

        <div className="glass-panel p-4">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Use one of your notes</h3>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet. Add some in /notes and they'll appear here.</p>
          ) : (
            <ul className="space-y-1">
              {notes.slice(0, 12).map((n) => (
                <li key={n.id}>
                  <button onClick={() => useNote(n)} className="w-full truncate rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground">
                    {n.title || "Untitled"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
