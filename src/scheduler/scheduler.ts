import type { Problem, Settings } from "../types/domain";

export type Clock = () => Date;
export type Rng = () => number;

export { review } from "./review";

export function placeReview(
  _problem: Problem,
  _calendarLoad: Record<string, number>,
  _cap: number,
  _now: Clock,
  _rng: Rng,
): Problem {
  throw new Error("Not implemented");
}

export function buildTodayQueue(
  _problems: Problem[],
  _now: Clock,
  _settings: Settings,
  _rng: Rng,
): Problem[] {
  throw new Error("Not implemented");
}
