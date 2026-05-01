const RANK_VALUES: Record<string, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export const HAND_LABELS = [
  "High Card",
  "Pair",
  "Two Pair",
  "Trips",
  "Straight",
  "Flush",
  "Full House",
  "Quads",
  "Straight Flush",
  "Royal Flush",
] as const;

type HandLabel = (typeof HAND_LABELS)[number];

type ParsedCard = {
  id: string;
  rank: number;
  suit: string;
};

type HandScore = {
  category: number;
  tiebreakers: number[];
  label: HandLabel;
};

export type MonteCarloResult = {
  win: number;
  lose: number;
  tie: number;
  handBreakdown: number[];
  simulations: number;
  opponents: number;
  elapsedMs: number;
};

export type MonteCarloAccumulator = {
  wins: number;
  losses: number;
  ties: number;
  handBreakdownCounts: number[];
};

function parseCard(cardId: string): ParsedCard {
  const suit = cardId.slice(-1);
  const rankText = cardId.slice(0, -1);
  const rank = RANK_VALUES[rankText];

  if (!rank || !suit) {
    throw new Error(`Invalid card id: ${cardId}`);
  }

  return { id: cardId, rank, suit };
}

function compareScores(left: HandScore, right: HandScore) {
  if (left.category !== right.category) {
    return left.category - right.category;
  }

  const maxLength = Math.max(left.tiebreakers.length, right.tiebreakers.length);

  for (let index = 0; index < maxLength; index += 1) {
    const delta = (left.tiebreakers[index] ?? 0) - (right.tiebreakers[index] ?? 0);

    if (delta !== 0) {
      return delta;
    }
  }

  return 0;
}

function findStraight(ranks: number[]) {
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);

  if (uniqueRanks[0] === 14) {
    uniqueRanks.push(1);
  }

  let streak = 1;

  for (let index = 1; index < uniqueRanks.length; index += 1) {
    if (uniqueRanks[index] === uniqueRanks[index - 1] - 1) {
      streak += 1;

      if (streak >= 5) {
        return uniqueRanks[index - 4];
      }
    } else {
      streak = 1;
    }
  }

  return null;
}

function evaluateSevenCardHand(cardIds: string[]): HandScore {
  const cards = cardIds.map(parseCard);
  const rankCounts = new Map<number, number>();
  const suitGroups = new Map<string, number[]>();

  for (const card of cards) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) ?? 0) + 1);

    const suitCards = suitGroups.get(card.suit) ?? [];
    suitCards.push(card.rank);
    suitGroups.set(card.suit, suitCards);
  }

  const sortedRanks = [...rankCounts.keys()].sort((a, b) => b - a);
  const flushRanks = [...suitGroups.values()].find((ranks) => ranks.length >= 5);

  if (flushRanks) {
    const straightFlushHigh = findStraight(flushRanks);

    if (straightFlushHigh) {
      if (straightFlushHigh === 14) {
        return {
          category: 9,
          tiebreakers: [14],
          label: "Royal Flush" satisfies HandLabel,
        };
      }

      return {
        category: 8,
        tiebreakers: [straightFlushHigh],
        label: "Straight Flush" satisfies HandLabel,
      };
    }
  }

  const groupedRanks = [...rankCounts.entries()].sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }

    return right[0] - left[0];
  });

  const quadEntry = groupedRanks.find(([, count]) => count === 4);

  if (quadEntry) {
    const kicker = sortedRanks.find((rank) => rank !== quadEntry[0]) ?? 0;

    return {
      category: 7,
      tiebreakers: [quadEntry[0], kicker],
      label: "Quads",
    };
  }

  const tripRanks = groupedRanks
    .filter(([, count]) => count >= 3)
    .map(([rank]) => rank)
    .sort((a, b) => b - a);
  const pairRanks = groupedRanks
    .filter(([, count]) => count >= 2)
    .map(([rank]) => rank)
    .sort((a, b) => b - a);

  if (tripRanks.length >= 1) {
    const fullHousePair =
      pairRanks.find((rank) => rank !== tripRanks[0]) ?? tripRanks[1] ?? null;

    if (fullHousePair !== null) {
      return {
        category: 6,
        tiebreakers: [tripRanks[0], fullHousePair],
        label: "Full House",
      };
    }
  }

  if (flushRanks) {
    const topFlush = [...flushRanks].sort((a, b) => b - a).slice(0, 5);

    return {
      category: 5,
      tiebreakers: topFlush,
      label: "Flush",
    };
  }

  const straightHigh = findStraight(sortedRanks);

  if (straightHigh) {
    return {
      category: 4,
      tiebreakers: [straightHigh],
      label: "Straight",
    };
  }

  if (tripRanks.length >= 1) {
    const kickers = sortedRanks.filter((rank) => rank !== tripRanks[0]).slice(0, 2);

    return {
      category: 3,
      tiebreakers: [tripRanks[0], ...kickers],
      label: "Trips",
    };
  }

  if (pairRanks.length >= 2) {
    const highPair = pairRanks[0];
    const lowPair = pairRanks[1];
    const kicker = sortedRanks.find(
      (rank) => rank !== highPair && rank !== lowPair,
    ) ?? 0;

    return {
      category: 2,
      tiebreakers: [highPair, lowPair, kicker],
      label: "Two Pair",
    };
  }

  if (pairRanks.length === 1) {
    const kickers = sortedRanks.filter((rank) => rank !== pairRanks[0]).slice(0, 3);

    return {
      category: 1,
      tiebreakers: [pairRanks[0], ...kickers],
      label: "Pair",
    };
  }

  return {
    category: 0,
    tiebreakers: sortedRanks.slice(0, 5),
    label: "High Card",
  };
}

function drawRandomCards(deck: string[], count: number) {
  const workingDeck = [...deck];

  for (let index = 0; index < count; index += 1) {
    const swapIndex =
      index + Math.floor(Math.random() * (workingDeck.length - index));
    [workingDeck[index], workingDeck[swapIndex]] = [
      workingDeck[swapIndex],
      workingDeck[index],
    ];
  }

  return workingDeck.slice(0, count);
}

export function createMonteCarloAccumulator(): MonteCarloAccumulator {
  return {
    wins: 0,
    losses: 0,
    ties: 0,
    handBreakdownCounts: new Array(HAND_LABELS.length).fill(0),
  };
}

export function runMonteCarloBatch(options: {
  heroHoleCards: string[];
  boardCards: string[];
  opponents: number;
  simulations: number;
  accumulator: MonteCarloAccumulator;
}) {
  const { heroHoleCards, boardCards, opponents, simulations, accumulator } = options;
  const usedCards = new Set([...heroHoleCards, ...boardCards]);
  const availableDeck = Object.keys(RANK_VALUES)
    .flatMap((rank) => ["S", "H", "D", "C"].map((suit) => `${rank}${suit}`))
    .filter((cardId) => !usedCards.has(cardId));
  const boardCardsNeeded = 5 - boardCards.length;
  const cardsNeededPerTrial = boardCardsNeeded + opponents * 2;

  for (let trial = 0; trial < simulations; trial += 1) {
    const draw = drawRandomCards(availableDeck, cardsNeededPerTrial);
    const simulatedBoard = [...boardCards, ...draw.slice(0, boardCardsNeeded)];
    const heroScore = evaluateSevenCardHand([...heroHoleCards, ...simulatedBoard]);
    const heroHandIndex = HAND_LABELS.findIndex(
      (label) => label === heroScore.label,
    );
    accumulator.handBreakdownCounts[heroHandIndex] += 1;

    let comparison = 1;

    for (let opponentIndex = 0; opponentIndex < opponents; opponentIndex += 1) {
      const start = boardCardsNeeded + opponentIndex * 2;
      const opponentHoleCards = draw.slice(start, start + 2);
      const opponentScore = evaluateSevenCardHand([
        ...opponentHoleCards,
        ...simulatedBoard,
      ]);
      const delta = compareScores(heroScore, opponentScore);

      if (delta < 0) {
        comparison = -1;
        break;
      }

      if (delta === 0) {
        comparison = 0;
      }
    }

    if (comparison > 0) {
      accumulator.wins += 1;
    } else if (comparison < 0) {
      accumulator.losses += 1;
    } else {
      accumulator.ties += 1;
    }
  }
}

export function finalizeMonteCarloResult(options: {
  accumulator: MonteCarloAccumulator;
  simulations: number;
  opponents: number;
  elapsedMs: number;
}) {
  const { accumulator, simulations, opponents, elapsedMs } = options;
  return {
    win: Number(((accumulator.wins / simulations) * 100).toFixed(1)),
    lose: Number(((accumulator.losses / simulations) * 100).toFixed(1)),
    tie: Number(((accumulator.ties / simulations) * 100).toFixed(1)),
    handBreakdown: accumulator.handBreakdownCounts.map((count) =>
      Number(((count / simulations) * 100).toFixed(1)),
    ),
    simulations,
    opponents,
    elapsedMs,
  } satisfies MonteCarloResult;
}
