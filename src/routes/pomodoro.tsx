import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";

export const Route = createFileRoute("/pomodoro")({
  head: () => ({
    meta: [
      { title: "Focus — Lumen" },
      { name: "description", content: "A quiet pomodoro timer for focused study." },
    ],
  }),
  component: Pomodoro,
});

type Mode = "focus" | "break";
const DURATIONS: Record<Mode, number> = { focus: 25 * 60, break: 5 * 60 };

function Pomodoro() {
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useLocalStorage<number>("lumen.sessions", 0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(ref.current!);
          setRunning(false);
          if (mode === "focus") setSessions((n) => n + 1);
          const nextMode: Mode = mode === "focus" ? "break" : "focus";
          setMode(nextMode);
          return DURATIONS[nextMode];
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running, mode, setSessions]);

  const reset = () => {
    setRunning(false);
    setSecondsLeft(DURATIONS[mode]);
  };

  const setModeAndReset = (m: Mode) => {
    setMode(m);
    setRunning(false);
    setSecondsLeft(DURATIONS[m]);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const pct = 1 - secondsLeft / DURATIONS[mode];
  const radius = 130;
  const circ = 2 * Math.PI * radius;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-8 pb-24 md:pb-0">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold">
          {mode === "focus" ? "Focus" : "Take a breath"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "focus"
            ? "25 minutes of quiet, undivided attention."
            : "5 minutes to rest your eyes."}
        </p>
      </div>

      <div className="glass-panel flex gap-1 p-1">
        {(["focus", "break"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setModeAndReset(m)}
            className={`rounded-md px-4 py-1.5 text-sm capitalize transition ${
              mode === m
                ? "bg-primary/20 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="relative grid place-items-center">
        <svg width="300" height="300" viewBox="0 0 300 300" className="-rotate-90">
          <defs>
            <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.66 0.20 275)" />
              <stop offset="100%" stopColor="oklch(0.78 0.14 280)" />
            </linearGradient>
          </defs>
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="oklch(1 0 0 / 0.08)"
            strokeWidth="10"
          />
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="url(#ring)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="font-display text-6xl font-semibold tabular-nums tracking-tight">
            {mm}:{ss}
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {sessions} sessions today
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-5 py-3 text-sm hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>
    </div>
  );
}
