import { describe, expect, it } from "vitest";
import { reviewLabel } from "../src/review-label";
import type { Problem } from "../src/types/domain";

function createProblem(overrides: Partial<Problem> = {}): Problem {
  return {
    id: "two-sum",
    title: "Two Sum",
    url: "https://leetcode.com/problems/two-sum/",
    leetcodeTag: "Medium",
    addedAt: "2026-07-14T10:00:00.000Z",
    lastReviewedAt: "2026-07-14T12:00:00.000Z",
    reviewHistory: [{ date: "2026-07-14T12:00:00.000Z", grade: "solid" }],
    easeFactor: 2.3,
    currentInterval: 7,
    repetitions: 1,
    softDueDate: "2026-07-21",
    hardDueDate: "2026-07-24",
    status: "active",
    ...overrides,
  };
}

describe("reviewLabel", () => {
  it("labels a problem whose soft due date is before today as overdue", () => {
    const problem = createProblem({ softDueDate: "2026-07-18" });

    expect(reviewLabel(problem, "2026-07-21")).toBe("Overdue since 2026-07-18");
  });

  it("labels a just-failed problem due today as failed", () => {
    const problem = createProblem({
      softDueDate: "2026-07-21",
      reviewHistory: [{ date: "2026-07-20T12:00:00.000Z", grade: "couldnt-solve" }],
    });

    expect(reviewLabel(problem, "2026-07-21")).toBe("Failed — due today");
  });

  it("labels a normal problem due today with its LeetCode tag", () => {
    const problem = createProblem({
      softDueDate: "2026-07-21",
      leetcodeTag: "Medium",
    });

    expect(reviewLabel(problem, "2026-07-21")).toBe("Due today · Medium");
  });
});
