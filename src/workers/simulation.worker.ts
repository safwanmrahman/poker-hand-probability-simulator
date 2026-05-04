import {
  createMonteCarloAccumulator,
  finalizeMonteCarloResult,
  runMonteCarloBatch,
  type MonteCarloResult,
} from "@/lib/poker";

const SIMULATION_BATCH_SIZE = 2500;

type SimulationWorkerRequest = {
  type: "run";
  heroHoleCards: string[];
  boardCards: string[];
  opponents: number;
  knownOpponentHoleCards: string[][];
  simulations: number;
};

type SimulationWorkerProgress = {
  type: "progress";
  completedSimulations: number;
  totalSimulations: number;
  progress: number;
};

type SimulationWorkerDone = {
  type: "done";
  result: MonteCarloResult;
};

type SimulationWorkerError = {
  type: "error";
  message: string;
};

type SimulationWorkerResponse =
  | SimulationWorkerProgress
  | SimulationWorkerDone
  | SimulationWorkerError;

function postMessageToClient(message: SimulationWorkerResponse) {
  self.postMessage(message);
}

self.onmessage = (event: MessageEvent<SimulationWorkerRequest>) => {
  if (event.data.type !== "run") {
    return;
  }

  try {
    const {
      heroHoleCards,
      boardCards,
      opponents,
      knownOpponentHoleCards,
      simulations,
    } = event.data;
    const accumulator = createMonteCarloAccumulator();
    const startedAt = performance.now();
    let completedSimulations = 0;

    while (completedSimulations < simulations) {
      const batchSize = Math.min(
        SIMULATION_BATCH_SIZE,
        simulations - completedSimulations,
      );

      runMonteCarloBatch({
        heroHoleCards,
        boardCards,
        opponents,
        knownOpponentHoleCards,
        simulations: batchSize,
        accumulator,
      });

      completedSimulations += batchSize;

      postMessageToClient({
        type: "progress",
        completedSimulations,
        totalSimulations: simulations,
        progress: Math.round((completedSimulations / simulations) * 100),
      });
    }

    postMessageToClient({
      type: "done",
      result: finalizeMonteCarloResult({
        accumulator,
        simulations,
        opponents,
        elapsedMs: Math.round(performance.now() - startedAt),
      }),
    });
  } catch (error) {
    postMessageToClient({
      type: "error",
      message:
        error instanceof Error ? error.message : "Simulation worker failed.",
    });
  }
};
