import { describe, expect, it } from "vitest";
import { placeReview } from "../../src/scheduler/scheduler";
import type { Problem } from "../../src/types/domain";

const fixedNow = () => new Date("2026-07-21T12:00:00.000Z");
const noFuzz = () => 0.5;

function createProblem(overrides: Partial<Problem> = {}): Problem {
  return {
    id: "two-sum",
    title: "Two Sum",
    url: "https://leetcode.com/problems/two-sum/",
    leetcodeTag: "Easy",
    addedAt: "2026-07-21T10:00:00.000Z",
    lastReviewedAt: "2026-07-21T12:00:00.000Z",
    reviewHistory: [{ date: "2026-07-21T12:00:00.000Z", grade: "easy" }],
    easeFactor: 2.3,
    currentInterval: 7,
    repetitions: 1,
    softDueDate: "2026-07-28",
    hardDueDate: "2026-07-31",
    status: "active",
    ...overrides,
  };
}

describe("placeReview", () => {
  it("places on the soft due date when that day is under the cap", () => {
    const problem = createProblem();
    const calendarLoad = { "2026-07-28": 3 };

    const result = placeReview(problem, calendarLoad, 8, fixedNow, noFuzz);

    expect(result.softDueDate).toBe("2026-07-28");
  });

  it("walks forward to the first under-cap day within the soft→hard window", () => {
    const problem = createProblem({
      softDueDate: "2026-07-28",
      hardDueDate: "2026-07-31",
    });
    const calendarLoad = {
      "2026-07-28": 8,
      "2026-07-29": 8,
      "2026-07-30": 5,
      "2026-07-31": 2,
    };

    const result = placeReview(problem, calendarLoad, 8, fixedNow, noFuzz);

    expect(result.softDueDate).toBe("2026-07-30");
  });

  it("places on the least-loaded day when the whole window is at cap", () => {
    const problem = createProblem({
      softDueDate: "2026-07-28",
      hardDueDate: "2026-07-31",
    });
    const calendarLoad = {
      "2026-07-28": 10,
      "2026-07-29": 12,
      "2026-07-30": 9,
      "2026-07-31": 11,
    };

    const result = placeReview(problem, calendarLoad, 8, fixedNow, noFuzz);

    expect(result.softDueDate).toBe("2026-07-30");
  });

  it("schedules failures for tomorrow only, ignoring a full calendar", () => {
    const problem = createProblem({
      currentInterval: 1,
      repetitions: 0,
      softDueDate: "2026-07-22",
      hardDueDate: "2026-07-23",
      reviewHistory: [
        { date: "2026-07-21T12:00:00.000Z", grade: "couldnt-solve" },
      ],
    });
    const calendarLoad = {
      "2026-07-22": 20,
      "2026-07-23": 0,
    };

    const result = placeReview(problem, calendarLoad, 8, fixedNow, noFuzz);

    expect(result.softDueDate).toBe("2026-07-22");
  });

  it("does not load-balance a failure onto a less-loaded later day", () => {
    const problem = createProblem({
      currentInterval: 1,
      repetitions: 0,
      softDueDate: "2026-07-22",
      hardDueDate: "2026-07-23",
      reviewHistory: [
        { date: "2026-07-21T12:00:00.000Z", grade: "couldnt-solve" },
      ],
    });
    const alwaysFuzzHigh = () => 1;
    const calendarLoad = { "2026-07-22": 99, "2026-07-23": 0 };

    const result = placeReview(
      problem,
      calendarLoad,
      8,
      fixedNow,
      alwaysFuzzHigh,
    );

    expect(result.softDueDate).toBe("2026-07-22");
  });
});
