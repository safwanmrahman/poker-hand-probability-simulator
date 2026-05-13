import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BOARD_STREETS, STREET_PRESETS } from "@/features/simulator/constants";
import type { ActiveTarget, OpponentMode, OpponentSeat } from "@/features/simulator/types";
import { cn } from "@/lib/utils";

import { PlayingCard } from "./playing-card";

type TableBuilderProps = {
  activeTarget: ActiveTarget;
  boardStage: string;
  clearAllBoardCards: () => void;
  clearAllHoleCards: () => void;
  clearAllOpponentSeats: () => void;
  clearBoardSlot: (slotIndex: number) => void;
  clearHoleSlot: (slotIndex: number) => void;
  clearOpponentSlot: (seatIndex: number, slotIndex: number) => void;
  dealBoardThrough: (targetCount: number) => void;
  getCardDetails: (cardId: string | null) => {
    rank: string;
    symbol: string;
    tone: string;
    label: string;
  } | null;
  insetPanelClass: string;
  isDarkMode: boolean;
  isRunningSimulation: boolean;
  mutedTextClass: string;
  outlineButtonClass: string;
  panelCardClass: string;
  selectedBoardCards: (string | null)[];
  selectedHoleCards: (string | null)[];
  setActiveTarget: (target: ActiveTarget) => void;
  setOpponentSeatMode: (seatIndex: number, mode: OpponentMode) => void;
  visibleOpponentSeats: OpponentSeat[];
};

export function TableBuilder({
  activeTarget,
  boardStage,
  clearAllBoardCards,
  clearAllHoleCards,
  clearAllOpponentSeats,
  clearBoardSlot,
  clearHoleSlot,
  clearOpponentSlot,
  dealBoardThrough,
  getCardDetails,
  insetPanelClass,
  isDarkMode,
  isRunningSimulation,
  mutedTextClass,
  outlineButtonClass,
  panelCardClass,
  selectedBoardCards,
  selectedHoleCards,
  setActiveTarget,
  setOpponentSeatMode,
  visibleOpponentSeats,
}: TableBuilderProps) {
  const seatToggleActiveClass = isDarkMode
    ? "border-primary/35 bg-primary/18 text-foreground shadow-none hover:bg-primary/24"
    : "border-[#5a4430] bg-secondary text-white shadow-none hover:bg-secondary/95";
  const seatToggleInactiveClass = outlineButtonClass;
  const seatCardClass = isDarkMode
    ? "border-white/10 bg-slate-950/38"
    : insetPanelClass;
  const randomSeatSlotButtonClass = isDarkMode
    ? "cursor-not-allowed text-slate-500"
    : "cursor-not-allowed text-stone-400";

  return (
    <div className="grid gap-6">
      <Card className={panelCardClass}>
        <CardHeader>
          <CardTitle>Table Builder</CardTitle>
          <CardDescription>
            Hero, board, and fixed opponents all draw from the same 52-card deck.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Hero hole cards</p>
              <Button
                variant="outline"
                size="sm"
                className={outlineButtonClass}
                onClick={clearAllHoleCards}
                disabled={isRunningSimulation}
              >
                Clear all
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedHoleCards.map((cardId, index) => {
                const card = getCardDetails(cardId);

                return (
                  <div
                    key={`hole-slot-${index}`}
                    className={cn(
                      "rounded-[1.6rem] border p-4",
                      activeTarget.area === "hole" && activeTarget.slot === index
                        ? "border-primary bg-primary/6"
                        : insetPanelClass,
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveTarget({ area: "hole", slot: index })}
                      className="flex w-full items-start gap-4 text-left"
                      disabled={isRunningSimulation}
                    >
                      <PlayingCard
                        value={card ? `${card.rank}${card.symbol}` : "--"}
                        caption={`Hero ${index + 1}`}
                        accent={card?.tone}
                        active={activeTarget.area === "hole" && activeTarget.slot === index}
                        filled={Boolean(card)}
                        isDarkMode={isDarkMode}
                      />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Hero slot {index + 1}</p>
                        <p className={cn("text-sm", mutedTextClass)}>
                          {card ? card.label : "Choose a card from the deck"}
                        </p>
                      </div>
                    </button>
                    {cardId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("mt-4 w-full", outlineButtonClass)}
                        onClick={() => clearHoleSlot(index)}
                        disabled={isRunningSimulation}
                      >
                        Clear slot
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium">Community board</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={outlineButtonClass}
                  onClick={clearAllBoardCards}
                  disabled={isRunningSimulation}
                >
                  Clear board
                </Button>
                {STREET_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    className={outlineButtonClass}
                    onClick={() => dealBoardThrough(preset.count)}
                    disabled={isRunningSimulation}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {selectedBoardCards.map((cardId, index) => {
                const card = getCardDetails(cardId);

                return (
                  <div
                    key={`board-slot-${index}`}
                    className={cn(
                      "rounded-[1.6rem] border p-4",
                      activeTarget.area === "board" && activeTarget.slot === index
                        ? "border-[var(--color-chart-tie)] bg-[color:rgba(205,149,44,0.08)]"
                        : insetPanelClass,
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveTarget({ area: "board", slot: index })}
                      className="space-y-3 text-left"
                      disabled={isRunningSimulation}
                    >
                      <p className="text-sm font-medium">{BOARD_STREETS[index]}</p>
                      <PlayingCard
                        value={card ? `${card.rank}${card.symbol}` : "--"}
                        caption={boardStage}
                        accent={card?.tone}
                        active={activeTarget.area === "board" && activeTarget.slot === index}
                        filled={Boolean(card)}
                        isDarkMode={isDarkMode}
                      />
                      <p className={cn("text-sm", mutedTextClass)}>
                        {card ? card.label : "Choose a card"}
                      </p>
                    </button>
                    {cardId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("mt-4 w-full", outlineButtonClass)}
                        onClick={() => clearBoardSlot(index)}
                        disabled={isRunningSimulation}
                      >
                        Clear slot
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium">Opponent seats</p>
              <Button
                variant="outline"
                size="sm"
                className={outlineButtonClass}
                onClick={clearAllOpponentSeats}
                disabled={isRunningSimulation}
              >
                Clear opponents
              </Button>
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {visibleOpponentSeats.map((seat, seatIndex) => (
                <div
                  key={`opponent-seat-${seatIndex}`}
                  className={cn("rounded-[1.6rem] border p-4", seatCardClass)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Opponent {seatIndex + 1}</p>
                      <p className={cn("mt-1 text-sm", mutedTextClass)}>
                        {seat.mode === "known"
                          ? "Cards are fixed into every trial."
                          : "Seat remains random each simulation."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={
                          seat.mode === "random"
                            ? seatToggleActiveClass
                            : seatToggleInactiveClass
                        }
                        onClick={() => setOpponentSeatMode(seatIndex, "random")}
                        disabled={isRunningSimulation}
                      >
                        Random
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={
                          seat.mode === "known"
                            ? seatToggleActiveClass
                            : seatToggleInactiveClass
                        }
                        onClick={() => setOpponentSeatMode(seatIndex, "known")}
                        disabled={isRunningSimulation}
                      >
                        Fixed
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    {seat.cards.map((cardId, slotIndex) => {
                      const card = getCardDetails(cardId);
                      const isActive =
                        seat.mode === "known" &&
                        activeTarget.area === "opponent" &&
                        activeTarget.seat === seatIndex &&
                        activeTarget.slot === slotIndex;

                      return (
                        <div key={`seat-${seatIndex}-slot-${slotIndex}`} className="space-y-3">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveTarget({
                                area: "opponent",
                                seat: seatIndex,
                                slot: slotIndex,
                              })
                            }
                            disabled={seat.mode !== "known" || isRunningSimulation}
                            className={cn(
                              seat.mode !== "known"
                                ? randomSeatSlotButtonClass
                                : "text-left",
                            )}
                          >
                            <PlayingCard
                              value={card ? `${card.rank}${card.symbol}` : "--"}
                              caption={`Opp ${slotIndex + 1}`}
                              accent={card?.tone}
                              active={isActive}
                              filled={Boolean(card)}
                              isDarkMode={isDarkMode}
                            />
                          </button>
                          {cardId ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className={outlineButtonClass}
                              onClick={() => clearOpponentSlot(seatIndex, slotIndex)}
                              disabled={isRunningSimulation}
                            >
                              Clear
                            </Button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
