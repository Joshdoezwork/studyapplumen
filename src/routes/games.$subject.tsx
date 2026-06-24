import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ListChecks, Loader2, Pencil, Rocket, RotateCcw, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { getSubject, checkShortAnswer, type QuizMode, type Question, type Topic } from "@/lib/quiz-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useLocalStorage } from "@/lib/use-local-storage";

export const Route = createFileRoute("/games/$subject")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.subject.toUpperCase()} — Lumen` },
      { name: "description", content: `Learn and test your knowledge in ${params.subject}.` },
    ],
  }),
  component: SubjectPage,
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getBadge(score: number, total: number) {
  const pct = total ? (score / total) * 100 : 0;
  if (pct === 100) return { title: "Legend", color: "text-emerald-400", subtitle: "Perfect run!" };
  if (pct >= 90) return { title: "Champion", color: "text-sky-400", subtitle: "Elite performance" };
  if (pct >= 75) return { title: "Ace", color: "text-amber-400", subtitle: "Strong streak" };
  if (pct >= 50) return { title: "Rising Star", color: "text-violet-400", subtitle: "Keep going" };
  return { title: "Apprentice", color: "text-stone-400", subtitle: "Practice makes progress" };
}

function getLevel(xp: number) {
  const level = Math.floor(xp / 100) + 1;
  const nextLevelXp = level * 100;
  return { level, nextLevelXp, progress: xp % 100 };
}

const GAME_THEMES = {
  classic: {
    label: "Classic Arcade",
    desc: "Steady streaks and XP for every correct answer.",
    accent: "from-primary to-accent",
    icon: ListChecks,
    done: "Quiz complete!",
  },
  block: {
    label: "Block Blast",
    desc: "Destroy blocks with every right answer.",
    accent: "from-emerald-400 to-cyan-400",
    icon: Sparkles,
    done: "Blocks cleared!",
  },
  rocket: {
    label: "Rocket Rush",
    desc: "Launch rockets through questions to earn fuel.",
    accent: "from-fuchsia-500 to-rose-500",
    icon: Rocket,
    done: "Mission accomplished!",
  },
} as const;

type GameTheme = keyof typeof GAME_THEMES;

function SubjectPage() {
  const { subject: subjectId } = Route.useParams();
  const subject = getSubject(subjectId);

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
        </div>

        <QuizTab subject={subject} />
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
  const [gameTheme, setGameTheme] = useState<GameTheme>("classic");
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
  const [combo, setCombo] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [bonusText, setBonusText] = useState("Ready to earn XP.");
  const [xp, setXp] = useLocalStorage<number>("games-xp", 0);
  const [bestScores, setBestScores] = useLocalStorage<Record<string, number>>("games-best-scores", {});

  const questions = useMemo<Question[]>(() => (topic ? shuffle(topic.questions) : []), [topic, seed, mode]);

  if (topic === null) {
    return (
      <div className="mt-4 space-y-4">
        <div className="glass-panel p-4">
          <div className="mb-3 text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">Choose your arcade mode</div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(GAME_THEMES) as GameTheme[]).map((key) => {
              const theme = GAME_THEMES[key];
              const Icon = theme.icon;
              return (
                <button key={key} type="button" onClick={() => setGameTheme(key)}
                  className={`flex flex-col gap-2 rounded-2xl border px-4 py-4 text-left transition ${gameTheme === key ? "border-primary bg-primary/10" : "border-border bg-white/5 hover:border-primary/40 hover:bg-white/10"}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Icon className="h-4 w-4" /> {theme.label}
                  </div>
                  <p className="text-xs text-muted-foreground">{theme.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
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
      </div>
    );
  }

  const theme = GAME_THEMES[gameTheme];

  if (mode === null) {
    return (
      <div className="mt-4">
        <button onClick={() => setTopic(null)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Topics
        </button>
        <div className="glass-panel p-6 text-center">
          <div className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">{theme.label}</div>
          <h2 className="font-display text-xl font-semibold">{topic.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{theme.desc}</p>
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left">
            <div className="text-sm font-medium text-primary">Daily challenge</div>
            <p className="mt-1 text-sm text-muted-foreground">Answer 3 questions in a row correctly for a growing combo bonus.</p>
          </div>
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
  const topicKey = topic ? `${subject.id}:${topic.id}:${mode}:${gameTheme}` : "";
  const bestForTopic = bestScores[topicKey] ?? 0;
  const rewardLabel = gameTheme === "block" ? "blocks" : gameTheme === "rocket" ? "fuel" : "XP";

  useEffect(() => {
    setBonusText(`Ready to earn ${rewardLabel}.`);
  }, [rewardLabel]);

  const resetQuestion = () => { setPicked(null); setShortInput(""); setShortSubmitted(false); setShortCorrect(false); };

  const applyXp = (correct: boolean, baseXp: number) => {
    if (!correct) {
      setCombo(0);
      setBonusText("Combo ended. Keep going!");
      return;
    }

    const nextCombo = combo + 1;
    setCombo(nextCombo);
    const bonus = Math.min(10, (nextCombo - 1) * 2);
    const earned = baseXp + bonus;
    setSessionXp((xp) => xp + earned);
    setXp((xp) => xp + earned);
    setBonusText(`+${earned} XP${bonus ? ` (${bonus} combo bonus)` : ""}`);
  };

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === q.answer;
    if (correct) setScore((s) => s + 1);
    applyXp(correct, 10);
  };

  const submitShort = () => {
    if (shortSubmitted || !shortInput.trim()) return;
    const ok = checkShortAnswer(q, shortInput);
    setShortSubmitted(true);
    setShortCorrect(ok);
    if (ok) setScore((s) => s + 1);
    applyXp(ok, 15);
  };

  const answered = mode === "mc" ? picked !== null : shortSubmitted;

  const next = async () => {
    if (idx + 1 < questions.length) { setIdx(idx + 1); resetQuestion(); }
    else {
      setDone(true);
      const finalBest = Math.max(bestForTopic, score);
      if (topicKey) setBestScores((prev) => ({ ...prev, [topicKey]: finalBest }));

      if (user && !saved) {
        try {
          const { error } = await supabase.from("quiz_scores").insert({
            user_id: user.id, subject: `${subject.id}:${topic.id}:${mode}`,
            score, total: questions.length,
          });
          if (error) {
            toast.error("Couldn't save score");
          } else {
            setSaved(true);
          }
        } catch (e) {
          toast.error("Could not save score. Check your network.");
        }
      }
    }
  };

  const restart = () => { setIdx(0); resetQuestion(); setScore(0); setDone(false); setSaved(false); setCombo(0); setSessionXp(0); setSeed((s) => s + 1); };

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
      <div className="mb-4 grid gap-3 sm:grid-cols-4 text-sm text-muted-foreground">
        <div>XP gained: <span className="text-foreground">{sessionXp}</span></div>
        <div>Combo: <span className="text-primary">{combo}</span></div>
        <div>Best score: <span className="text-foreground">{bestForTopic}/{questions.length}</span></div>
        <div>Level: <span className="text-foreground">{getLevel(xp).level}</span></div>
      </div>
      <div className="glass-panel rounded-2xl border border-border bg-white/5 p-4">
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-muted-foreground">
          <span>Level {getLevel(xp).level} progress</span>
          <span>{getLevel(xp).progress}/100 XP</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${getLevel(xp).progress}%` }} />
        </div>
      </div>
      <div className="mt-4 glass-panel p-6">
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
