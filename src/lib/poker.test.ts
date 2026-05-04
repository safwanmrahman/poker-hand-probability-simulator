import { describe, expect, it } from "vitest";

import {
  createMonteCarloAccumulator,
  evaluateSevenCardHand,
  finalizeMonteCarloResult,
  runMonteCarloBatch,
} from "@/lib/poker";

describe("evaluateSevenCardHand", () => {
  it("detects a royal flush", () => {
    const hand = evaluateSevenCardHand(["AS", "KS", "QS", "JS", "10S", "2D", "3C"]);

    expect(hand.label).toBe("Royal Flush");
    expect(hand.category).toBe(9);
  });

  it("detects a wheel straight", () => {
    const hand = evaluateSevenCardHand(["AS", "2H", "3D", "4C", "5S", "KD", "QC"]);

    expect(hand.label).toBe("Straight");
    expect(hand.tiebreakers[0]).toBe(5);
  });
});

describe("runMonteCarloBatch", () => {
  it("uses fixed opponent cards in a fully deterministic run", () => {
    const accumulator = createMonteCarloAccumulator();

    runMonteCarloBatch({
      heroHoleCards: ["AS", "AH"],
      boardCards: ["AD", "KS", "KH", "2C", "3D"],
      opponents: 1,
      knownOpponentHoleCards: [["QS", "QH"]],
      simulations: 1,
      accumulator,
    });

    const result = finalizeMonteCarloResult({
      accumulator,
      simulations: 1,
      opponents: 1,
      elapsedMs: 1,
    });

    expect(result.win).toBe(100);
    expect(result.lose).toBe(0);
    expect(result.tie).toBe(0);
    expect(result.handBreakdown[6]).toBe(100);
  });

  it("records ties when the board forces the same best hand", () => {
    const accumulator = createMonteCarloAccumulator();

    runMonteCarloBatch({
      heroHoleCards: ["2S", "3H"],
      boardCards: ["AS", "KS", "QS", "JS", "10S"],
      opponents: 1,
      knownOpponentHoleCards: [["4D", "4C"]],
      simulations: 1,
      accumulator,
    });

    const result = finalizeMonteCarloResult({
      accumulator,
      simulations: 1,
      opponents: 1,
      elapsedMs: 1,
    });

    expect(result.win).toBe(0);
    expect(result.lose).toBe(0);
    expect(result.tie).toBe(100);
    expect(result.handBreakdown[9]).toBe(100);
  });
});
