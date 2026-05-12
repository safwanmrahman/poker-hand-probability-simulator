import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DECK } from "@/features/simulator/constants";
import { cn } from "@/lib/utils";

type SharedDeckProps = {
  activeTargetLabel: string;
  assignCardToTarget: (cardId: string) => void;
  isDarkMode: boolean;
  isRunningSimulation: boolean;
  mutedPanelClass: string;
  mutedTextClass: string;
  panelCardClass: string;
  remainingDeckCount: number;
  usedCards: Set<string>;
};

export function SharedDeck({
  activeTargetLabel,
  assignCardToTarget,
  isDarkMode,
  isRunningSimulation,
  mutedPanelClass,
  mutedTextClass,
  panelCardClass,
  remainingDeckCount,
  usedCards,
}: SharedDeckProps) {
  return (
    <Card className={panelCardClass}>
      <CardHeader>
        <CardTitle>Shared Deck</CardTitle>
        <CardDescription>
          Choose cards from the remaining deck for the active slot.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border px-4 py-3 text-sm",
            mutedPanelClass,
          )}
        >
          <p className="font-medium">
            Active target: <span className="text-primary">{activeTargetLabel}</span>
          </p>
          <p className={mutedTextClass}>{remainingDeckCount} cards available</p>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {DECK.map((card) => {
            const isUsed = usedCards.has(card.id);

            return (
              <button
                key={card.id}
                type="button"
                disabled={isUsed || isRunningSimulation}
                onClick={() => assignCardToTarget(card.id)}
                className={cn(
                  "rounded-xl border px-2 py-3 text-center text-sm font-semibold transition-all",
                  isUsed || isRunningSimulation
                    ? isDarkMode
                      ? "cursor-not-allowed border-white/10 bg-muted/35 text-muted-foreground line-through opacity-70"
                      : "cursor-not-allowed border-[#e1d3c1] bg-[#f7f0e6] text-stone-500 line-through opacity-75"
                    : isDarkMode
                      ? "border-white/10 bg-slate-950/55 text-foreground hover:border-primary/40 hover:bg-primary/12"
                      : "border-[#ddccb6] bg-[#fffefb] text-slate-900 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/6",
                )}
              >
                <span className={card.tone}>{card.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
