import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";

export const Route = createFileRoute("/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards — Lumen" },
      { name: "description", content: "Create decks and study with flippable flashcards." },
    ],
  }),
  component: Flashcards,
});

type Card = { id: string; front: string; back: string };
type Deck = { id: string; name: string; cards: Card[] };

const uid = () => Math.random().toString(36).slice(2, 9);

function Flashcards() {
  const [decks, setDecks] = useLocalStorage<Deck[]>("lumen.decks", [
    {
      id: uid(),
      name: "Welcome",
      cards: [
        { id: uid(), front: "What is Lumen?", back: "A calm study companion." },
        { id: uid(), front: "How do I flip?", back: "Click the card." },
      ],
    },
  ]);
  const [activeId, setActiveId] = useState<string>(decks[0]?.id ?? "");
  const active = decks.find((d) => d.id === activeId) ?? decks[0];

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const card = active?.cards[idx];

  const addDeck = () => {
    const name = prompt("Deck name?");
    if (!name) return;
    const d = { id: uid(), name, cards: [] };
    setDecks([...decks, d]);
    setActiveId(d.id);
    setIdx(0);
  };

  const addCard = () => {
    if (!front.trim() || !back.trim() || !active) return;
    setDecks(
      decks.map((d) =>
        d.id === active.id
          ? { ...d, cards: [...d.cards, { id: uid(), front, back }] }
          : d,
      ),
    );
    setFront("");
    setBack("");
  };

  const removeCard = (id: string) => {
    if (!active) return;
    setDecks(
      decks.map((d) =>
        d.id === active.id ? { ...d, cards: d.cards.filter((c) => c.id !== id) } : d,
      ),
    );
    setIdx(0);
  };

  const removeDeck = (id: string) => {
    if (!confirm("Delete this deck?")) return;
    const next = decks.filter((d) => d.id !== id);
    setDecks(next);
    setActiveId(next[0]?.id ?? "");
  };

  const next = () => {
    if (!active || active.cards.length === 0) return;
    setFlipped(false);
    setIdx((i) => (i + 1) % active.cards.length);
  };
  const prev = () => {
    if (!active || active.cards.length === 0) return;
    setFlipped(false);
    setIdx((i) => (i - 1 + active.cards.length) % active.cards.length);
  };

  const progress = useMemo(
    () => (active && active.cards.length ? ((idx + 1) / active.cards.length) * 100 : 0),
    [active, idx],
  );

  return (
    <div className="grid gap-6 pb-24 md:grid-cols-[260px_1fr] md:pb-0">
      <aside className="glass-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Decks
          </h2>
          <button
            onClick={addDeck}
            className="grid h-7 w-7 place-items-center rounded-md bg-primary/20 text-primary-foreground hover:bg-primary/30"
            aria-label="New deck"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <ul className="space-y-1">
          {decks.map((d) => (
            <li key={d.id} className="group flex items-center gap-1">
              <button
                onClick={() => {
                  setActiveId(d.id);
                  setIdx(0);
                  setFlipped(false);
                }}
                className={`flex-1 truncate rounded-md px-3 py-2 text-left text-sm transition ${
                  d.id === active?.id
                    ? "bg-primary/20 text-foreground"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <span className="block truncate">{d.name}</span>
                <span className="block text-xs text-muted-foreground/70">
                  {d.cards.length} cards
                </span>
              </button>
              <button
                onClick={() => removeDeck(d.id)}
                className="rounded-md p-1.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                aria-label="Delete deck"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {decks.length === 0 && (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              No decks yet — make one above.
            </p>
          )}
        </ul>
      </aside>

      <div className="space-y-6">
        {active ? (
          <>
            <div>
              <h1 className="font-display text-3xl font-semibold">{active.name}</h1>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {card ? (
              <div className="space-y-4">
                <button
                  onClick={() => setFlipped((f) => !f)}
                  className="glass-panel grid min-h-[280px] w-full place-items-center px-8 py-12 text-center transition hover:border-primary/40"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {flipped ? "Back" : "Front"}
                    </p>
                    <p className="mt-4 font-display text-2xl leading-snug md:text-3xl">
                      {flipped ? card.back : card.front}
                    </p>
                    <p className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <RotateCw className="h-3 w-3" /> tap to flip
                    </p>
                  </div>
                </button>
                <div className="flex items-center justify-between">
                  <button
                    onClick={prev}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {idx + 1} / {active.cards.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => removeCard(card.id)}
                      className="rounded-lg border border-border bg-white/5 px-3 py-2 text-sm text-muted-foreground hover:text-destructive"
                      aria-label="Delete card"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={next}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel grid min-h-[240px] place-items-center text-muted-foreground">
                No cards yet — add your first below.
              </div>
            )}

            <div className="glass-panel p-5">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Add a card
              </h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <textarea
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Front (question)"
                  rows={3}
                  className="resize-none rounded-lg border border-border bg-background/60 p-3 text-sm outline-none focus:border-primary"
                />
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Back (answer)"
                  rows={3}
                  className="resize-none rounded-lg border border-border bg-background/60 p-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={addCard}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Add card
              </button>
            </div>
          </>
        ) : (
          <div className="glass-panel grid place-items-center py-20 text-muted-foreground">
            Create a deck to begin.
          </div>
        )}
      </div>
    </div>
  );
}
