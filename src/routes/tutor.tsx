import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, Trash2, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { loadTutorMessages, saveTutorMessage, clearTutorMessages } from "@/lib/tutor.functions";
import { useLocalStorage } from "@/lib/use-local-storage";

export const Route = createFileRoute("/tutor")({
  head: () => ({
    meta: [
      { title: "AI Tutor — Lumen" },
      { name: "description", content: "Your AI study assistant: explain, summarize, quiz." },
    ],
  }),
  component: TutorPage,
});

type LocalNote = { id: string; title: string; body: string };

function TutorPage() {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const load = useServerFn(loadTutorMessages);
  const save = useServerFn(saveTutorMessage);
  const clearFn = useServerFn(clearTutorMessages);
  const [notes] = useLocalStorage<LocalNote[]>("lumen.notes", []);
  const [token, setToken] = useState<string | null>(null);
  const lastSaved = useRef<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const rows = await load();
        const uiMsgs: UIMessage[] = rows.map((r) => ({
          id: r.id,
          role: r.role as "user" | "assistant",
          parts: [{ type: "text", text: r.content }],
        }));
        uiMsgs.forEach((m) => lastSaved.current.add(m.id));
        setInitial(uiMsgs);
      } catch {
        setInitial([]);
      }
    })();
  }, [load]);

  if (initial === null || token === null) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">Loading…</div>
    );
  }

  return <TutorChat initial={initial} token={token} notes={notes} save={save} clearFn={clearFn} lastSaved={lastSaved} />;
}

function TutorChat({
  initial, token, notes, save, clearFn, lastSaved,
}: {
  initial: UIMessage[];
  token: string;
  notes: LocalNote[];
  save: ReturnType<typeof useServerFn<typeof saveTutorMessage>>;
  clearFn: ReturnType<typeof useServerFn<typeof clearTutorMessages>>;
  lastSaved: React.MutableRefObject<Set<string>>;
}) {
  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      headers: { Authorization: `Bearer ${token}` },
    }),
  ).current;

  const { messages, sendMessage, status, setMessages } = useChat({
    messages: initial,
    transport,
    onError: (e) => toast.error(e.message || "Chat error"),
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Persist new messages
  useEffect(() => {
    const persist = async () => {
      for (const m of messages) {
        if (lastSaved.current.has(m.id)) continue;
        if (status === "streaming" && m === messages[messages.length - 1]) continue;
        const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("").trim();
        if (!text) continue;
        if (m.role !== "user" && m.role !== "assistant") continue;
        lastSaved.current.add(m.id);
        try { await save({ data: { role: m.role, content: text } }); } catch { /* ignore */ }
      }
    };
    persist();
  }, [messages, status, save, lastSaved]);

  const isLoading = status === "submitted" || status === "streaming";

  const submit = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput("");
    await sendMessage({ text: text.trim() });
  };

  const quickActions = [
    { label: "Explain simply", text: "Explain the following concept in simple terms with an example: " },
    {
      label: "Summarize my notes",
      text: notes.length === 0
        ? "I don't have any notes yet — remind me to add some in /notes."
        : `Summarize the key ideas in these notes:\n\n${notes.slice(0, 5).map((n) => `### ${n.title}\n${n.body}`).join("\n\n").slice(0, 8000)}`,
    },
    { label: "Make me a quiz", text: "Generate a 5-question practice quiz (mixed difficulty) on: " },
  ];

  const handleClear = async () => {
    if (!confirm("Clear your full tutor history?")) return;
    try {
      await clearFn();
      setMessages([]);
      lastSaved.current.clear();
      toast.success("History cleared");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col pb-32 md:pb-0">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            <Bot className="h-4 w-4" /> AI Tutor
          </div>
          <h1 className="mt-1 font-display text-2xl font-semibold">Ask, explain, summarize, quiz.</h1>
        </div>
        {messages.length > 0 && (
          <button onClick={handleClear} className="flex items-center gap-1 rounded-lg border border-border bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      <div ref={scrollRef} className="glass-panel flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div className="max-w-md">
              <Sparkles className="mx-auto h-8 w-8 text-primary" />
              <h2 className="mt-3 font-display text-xl font-semibold">Ready when you are</h2>
              <p className="mt-2 text-sm text-muted-foreground">Ask anything from math to history. Try a quick action below.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {messages.map((m) => {
              const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              const isUser = m.role === "user";
              return (
                <li key={m.id} className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
                  {!isUser && (
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    isUser ? "bg-primary/20 text-foreground" : "border border-border bg-white/5"
                  }`}>
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:mt-2 prose-headings:mb-1 prose-pre:my-2 prose-ul:my-1 prose-ol:my-1">
                      <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                  </div>
                  {isUser && (
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </li>
              );
            })}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <li className="flex gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="rounded-2xl border border-border bg-white/5 px-4 py-2.5 text-sm text-muted-foreground">
                  Thinking…
                </div>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="mt-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => setInput(a.text)}
              className="rounded-full border border-border bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
            >
              {a.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
          className="glass-panel flex items-end gap-2 p-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); }
            }}
            rows={1}
            placeholder="Ask me to explain photosynthesis, solve 2x+3=11, or quiz me on WWII…"
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
