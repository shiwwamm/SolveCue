import { describe, expect, it } from "vitest";
import {
  buildTodayQueue,
  placeReview,
  review,
} from "../../src/scheduler/scheduler";
import type { Problem, Settings } from "../../src/types/domain";

describe("scheduler module surface", () => {
  it("exports review with injected clock and rng", () => {
    const problem = {} as Problem;
    const now = () => new Date("2026-07-21T12:00:00.000Z");
    const rng = () => 0.5;

    expect(() => review(problem, "solid", now, rng)).toThrow(
      "Not implemented",
    );
  });

  it("exports placeReview with injected clock and rng", () => {
    const problem = {} as Problem;
    const now = () => new Date("2026-07-21T12:00:00.000Z");
    const rng = () => 0.5;

    expect(() =>
      placeReview(problem, {}, 8, now, rng),
    ).toThrow("Not implemented");
  });

  it("exports buildTodayQueue with injected clock and rng", () => {
    const problems: Problem[] = [];
    const settings = {} as Settings;
    const now = () => new Date("2026-07-21T12:00:00.000Z");
    const rng = () => 0.5;

    expect(() =>
      buildTodayQueue(problems, now, settings, rng),
    ).toThrow("Not implemented");
  });
});
