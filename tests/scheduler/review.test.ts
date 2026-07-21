import { describe, expect, it } from "vitest";
import { review } from "../../src/scheduler/scheduler";
import type { Grade, Problem } from "../../src/types/domain";

const fixedNow = () => new Date("2026-07-21T12:00:00.000Z");
const noFuzz = () => 0.5;

function createProblem(overrides: Partial<Problem> = {}): Problem {
  return {
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
    ...overrides,
  };
}

describe("review", () => {
  it("schedules a first Easy grade for 7 days out", () => {
    const result = review(createProblem(), "easy", fixedNow, noFuzz);

    expect(result.currentInterval).toBe(7);
    expect(result.repetitions).toBe(1);
    expect(result.softDueDate).toBe("2026-07-28");
    expect(result.hardDueDate).toBe("2026-07-31");
    expect(result.reviewHistory).toEqual([
      { date: "2026-07-21T12:00:00.000Z", grade: "easy" },
    ]);
  });

  it("progresses Easy from 7 to 14 days on the next Easy review", () => {
    const problem = createProblem({
      currentInterval: 7,
      repetitions: 1,
      easeFactor: 2.45,
      reviewHistory: [{ date: "2026-07-14T12:00:00.000Z", grade: "easy" }],
    });

    const result = review(problem, "easy", fixedNow, noFuzz);

    expect(result.currentInterval).toBe(14);
    expect(result.repetitions).toBe(2);
    expect(result.softDueDate).toBe("2026-08-04");
  });

  it("resets to a 1-day interval when graded Couldn't solve", () => {
    const problem = createProblem({
      currentInterval: 14,
      repetitions: 2,
      easeFactor: 2.6,
    });

    const result = review(problem, "couldnt-solve", fixedNow, noFuzz);

    expect(result.currentInterval).toBe(1);
    expect(result.repetitions).toBe(0);
    expect(result.softDueDate).toBe("2026-07-22");
    expect(result.hardDueDate).toBe("2026-07-23");
    expect(result.easeFactor).toBeLessThan(2.6);
  });

  it.each([
    ["easy", 7],
    ["struggled", 2],
    ["solid", 2],
    ["couldnt-solve", 1],
  ] as const)("grades a fresh problem as %s with a %i-day interval", (grade, interval) => {
    const result = review(createProblem(), grade, fixedNow, noFuzz);

    expect(result.currentInterval).toBe(interval);
  });

  it("does not use the LeetCode difficulty tag when scheduling", () => {
    const easyTag = review(createProblem({ leetcodeTag: "Easy" }), "solid", fixedNow, noFuzz);
    const hardTag = review(createProblem({ leetcodeTag: "Hard" }), "solid", fixedNow, noFuzz);

    expect(easyTag.currentInterval).toBe(hardTag.currentInterval);
    expect(easyTag.softDueDate).toBe(hardTag.softDueDate);
  });
});
