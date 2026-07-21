import { addCalendarDays } from "./dates";
import type { Clock, Rng } from "./scheduler";
import type { Grade, Problem } from "../types/domain";

const INITIAL_EASE = 2.3;
const EASE_MIN = 1.3;
const EASE_MAX = 3.0;
const FIRST_EASY_INTERVAL = 7;
const FUZZ_FACTOR = 0.12;

function applyFuzz(interval: number, grade: Grade, rng: Rng): number {
  if (grade === "couldnt-solve" || interval <= 1) {
    return interval;
  }

  const fuzzMultiplier = 1 + (rng() * 2 - 1) * FUZZ_FACTOR;
  return Math.max(1, Math.round(interval * fuzzMultiplier));
}

export function review(
  problem: Problem,
  grade: Grade,
  now: Clock,
  rng: Rng,
): Problem {
  const reviewedAt = now().toISOString();
  const priorRepetitions = problem.repetitions;
  const priorInterval = problem.currentInterval;
  let easeFactor = problem.easeFactor;
  let repetitions = priorRepetitions;
  let interval: number;

  switch (grade) {
    case "couldnt-solve":
      repetitions = 0;
      interval = 1;
      easeFactor = Math.max(EASE_MIN, easeFactor - 0.2);
      break;
    case "struggled":
      repetitions += 1;
      interval =
        priorRepetitions === 0
          ? 2
          : Math.max(1, Math.round(priorInterval * 1.2));
      easeFactor = Math.max(EASE_MIN, easeFactor - 0.15);
      break;
    case "solid":
      repetitions += 1;
      interval =
        priorRepetitions === 0
          ? Math.round(easeFactor)
          : Math.max(1, Math.round(priorInterval * easeFactor));
      break;
    case "easy":
      repetitions += 1;
      interval =
        priorRepetitions === 0
          ? FIRST_EASY_INTERVAL
          : Math.max(1, Math.round(priorInterval * 2));
      easeFactor = Math.min(EASE_MAX, easeFactor + 0.15);
      break;
  }

  interval = applyFuzz(interval, grade, rng);
  const today = now();
  const hardInterval = Math.ceil(interval * 1.3);

  return {
    ...problem,
    lastReviewedAt: reviewedAt,
    reviewHistory: [...problem.reviewHistory, { date: reviewedAt, grade }],
    easeFactor,
    currentInterval: interval,
    repetitions,
    softDueDate: addCalendarDays(today, interval),
    hardDueDate: addCalendarDays(today, hardInterval),
  };
}

export { INITIAL_EASE };
