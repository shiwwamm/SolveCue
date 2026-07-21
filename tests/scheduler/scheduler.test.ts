import { describe, expect, it } from "vitest";
import {
  buildTodayQueue,
  placeReview,
  review,
} from "../../src/scheduler/scheduler";
import type { Problem, Settings } from "../../src/types/domain";

const fixedNow = () => new Date("2026-07-21T12:00:00.000Z");
const noFuzz = () => 0.5;

describe("scheduler module surface", () => {
  it("exports review with injected clock and rng", () => {
    const problem = {
      id: "two-sum",
      title: "Two Sum",
      url: "https://leetcode.com/problems/two-sum/",
      leetcodeTag: "Easy",
      addedAt: "2026-07-21T10:00:00.000Z",
      lastReviewedAt: null,
      reviewHistory: [],
      easeFactor: 2.3,
      currentInterval: 0,
      repetitions: 0,
      softDueDate: null,
      hardDueDate: null,
      status: "active",
    } satisfies Problem;

    expect(review(problem, "solid", fixedNow, noFuzz).currentInterval).toBe(2);
  });

  it("exports placeReview with injected clock and rng", () => {
    const problem = {} as Problem;

    expect(() => placeReview(problem, {}, 8, fixedNow, noFuzz)).toThrow(
      "Not implemented",
    );
  });

  it("exports buildTodayQueue with injected clock and rng", () => {
    const problems: Problem[] = [];
    const settings = {} as Settings;

    expect(() => buildTodayQueue(problems, fixedNow, settings, noFuzz)).toThrow(
      "Not implemented",
    );
  });
});
