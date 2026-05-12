import { HAND_LABELS } from "@/lib/poker";

import { DECK } from "@/features/simulator/constants";
import type { OpponentMode, OpponentSeat } from "@/features/simulator/types";

export function createDefaultOpponentSeats() {
  return Array.from({ length: 9 }, () => ({
    mode: "random" as OpponentMode,
    cards: [null, null],
  }));
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function clampIndex(index: number, max: number) {
  return Math.min(Math.max(index, 0), max);
}

export function shuffleCards(cardIds: string[]) {
  const shuffled = [...cardIds];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function normalizeSeat(seat: Partial<OpponentSeat> | undefined): OpponentSeat {
  return {
    mode: seat?.mode === "known" ? "known" : "random",
    cards: [seat?.cards?.[0] ?? null, seat?.cards?.[1] ?? null],
  };
}

export function formatCards(cardIds: (string | null)[]) {
  return cardIds.filter((cardId): cardId is string => cardId !== null).join(" ")
    || "No cards selected";
}

export function getTopHandLabels(handBreakdown: number[]) {
  return HAND_LABELS.map((label, index) => ({
    label,
    value: handBreakdown[index] ?? 0,
  }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 3);
}

export function getCardDetails(cardId: string | null) {
  return DECK.find((card) => card.id === cardId) ?? null;
}

export function getUsedCards(
  selectedHoleCards: (string | null)[],
  selectedBoardCards: (string | null)[],
  opponentSeats: OpponentSeat[],
  opponentCount: number,
) {
  return new Set(
    [
      ...selectedHoleCards,
      ...selectedBoardCards,
      ...opponentSeats
        .slice(0, opponentCount)
        .flatMap((seat) => (seat.mode === "known" ? seat.cards : [])),
    ].filter((cardId): cardId is string => cardId !== null),
  );
}

export function getKnownSeatCount(opponentSeats: OpponentSeat[], opponentCount: number) {
  return opponentSeats
    .slice(0, opponentCount)
    .filter((seat) => seat.mode === "known")
    .length;
}

export function downloadTextFile(
  fileName: string,
  contents: string,
  contentType: string,
) {
  const blob = new Blob([contents], { type: contentType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(objectUrl);
}
