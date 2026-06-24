import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useLocalStorage } from "@/lib/use-local-storage";
import { logStudySession } from "@/lib/study-sessions.functions";

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

function Pomodoro() {
  const [mode, setMode] = useState<Mode>("focus");
  const [focusMinutes, setFocusMinutes] = useLocalStorage<number>("pomodoro.focusMinutes", 25);
  const [breakMinutes, setBreakMinutes] = useLocalStorage<number>("pomodoro.breakMinutes", 5);
  const [secondsLeft, setSecondsLeft] = useState(focusMinutes * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useLocalStorage<number>("lumen.sessions", 0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const log = useServerFn(logStudySession);

  const currentDuration = mode === "focus" ? focusMinutes * 60 : breakMinutes * 60;

  useEffect(() => {
    if (!running) {
      setSecondsLeft(currentDuration);
    }
  }, [currentDuration, running]);

  const playAlarm = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // ignore unsupported audio context
    }
  };

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(ref.current!);
          setRunning(false);
          playAlarm();
          if (mode === "focus") {
            setSessions((n) => n + 1);
            // Persist study session to backend (powers streaks + analytics)
            log({ data: { minutes: focusMinutes, source: "pomodoro" } }).catch(() => {});
          }
          const nextMode: Mode = mode === "focus" ? "break" : "focus";
          setMode(nextMode);
          return nextMode === "focus" ? focusMinutes * 60 : breakMinutes * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running, mode, setSessions, log]);

  const reset = () => {
    setRunning(false);
    setSecondsLeft(currentDuration);
  };

  const setModeAndReset = (m: Mode) => {
    setMode(m);
    setRunning(false);
    setSecondsLeft(m === "focus" ? focusMinutes * 60 : breakMinutes * 60);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const pct = 1 - secondsLeft / currentDuration;
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
            ? `${focusMinutes} minutes of quiet, undivided attention.`
            : `${breakMinutes} minutes to rest your eyes.`}
        </p>
      </div>

      <div className="glass-panel grid gap-3 p-4 sm:grid-cols-2">
        <label className="block text-sm">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Focus length</div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={5}
              max={120}
              value={focusMinutes}
              onChange={(e) => setFocusMinutes(Math.max(5, Math.min(120, Number(e.target.value) || 25)))}
              className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <span className="text-sm text-muted-foreground">min</span>
          </div>
        </label>
        <label className="block text-sm">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Break length</div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={60}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Math.max(1, Math.min(60, Number(e.target.value) || 5)))}
              className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <span className="text-sm text-muted-foreground">min</span>
          </div>
        </label>
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
