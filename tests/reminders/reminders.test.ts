import { describe, expect, it } from "vitest";
import {
  dueTodayCount,
  formatBadgeText,
  nextRolloverAlarmTime,
} from "../../src/reminders/reminders";
import type { Problem, Settings } from "../../src/types/domain";
import { DEFAULT_SETTINGS } from "../../src/types/domain";

const noFuzz = () => 0.5;

function createProblem(overrides: Partial<Problem> = {}): Problem {
  return {
    id: "two-sum",
    title: "Two Sum",
    url: "https://leetcode.com/problems/two-sum/",
    leetcodeTag: "Easy",
    addedAt: "2026-07-14T12:00:00.000Z",
    lastReviewedAt: "2026-07-14T12:00:00.000Z",
    reviewHistory: [{ date: "2026-07-14T12:00:00.000Z", grade: "solid" }],
    easeFactor: 2.5,
    currentInterval: 7,
    repetitions: 1,
    softDueDate: "2026-07-22",
    hardDueDate: "2026-07-25",
    status: "active",
    ...overrides,
  };
}

describe("dueTodayCount", () => {
  it("returns the size of today's review queue", () => {
    const settings: Settings = { ...DEFAULT_SETTINGS, dailyTargetCap: 8 };
    const now = () => new Date(2026, 6, 22, 12, 0, 0);

    const count = dueTodayCount(
      [
        createProblem({ id: "a", softDueDate: "2026-07-22" }),
        createProblem({ id: "b", softDueDate: "2026-07-22" }),
        createProblem({ id: "c", softDueDate: "2026-07-23" }),
      ],
      now,
      settings,
      noFuzz,
    );

    expect(count).toBe(2);
  });

  it("honors the configured rollover hour for the scheduling day", () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      dayRolloverHour: 4,
    };

    // 2 AM is still the previous scheduling day when rollover is 4 AM.
    const beforeRollover = () => new Date(2026, 6, 22, 2, 0, 0);
    expect(
      dueTodayCount(
        [createProblem({ softDueDate: "2026-07-21" })],
        beforeRollover,
        settings,
        noFuzz,
      ),
    ).toBe(1);

    expect(
      dueTodayCount(
        [createProblem({ softDueDate: "2026-07-22" })],
        beforeRollover,
        settings,
        noFuzz,
      ),
    ).toBe(0);

    const afterRollover = () => new Date(2026, 6, 22, 4, 0, 0);
    expect(
      dueTodayCount(
        [createProblem({ softDueDate: "2026-07-22" })],
        afterRollover,
        settings,
        noFuzz,
      ),
    ).toBe(1);
  });
});

describe("nextRolloverAlarmTime", () => {
  it("schedules today's rollover when still before the hour", () => {
    const now = new Date(2026, 6, 22, 2, 30, 0);
    expect(nextRolloverAlarmTime(now, 4)).toEqual(new Date(2026, 6, 22, 4, 0, 0));
  });

  it("schedules tomorrow's rollover when at or past the hour", () => {
    const atRollover = new Date(2026, 6, 22, 4, 0, 0);
    expect(nextRolloverAlarmTime(atRollover, 4)).toEqual(
      new Date(2026, 6, 23, 4, 0, 0),
    );

    const afterRollover = new Date(2026, 6, 22, 15, 0, 0);
    expect(nextRolloverAlarmTime(afterRollover, 4)).toEqual(
      new Date(2026, 6, 23, 4, 0, 0),
    );
  });
});

describe("formatBadgeText", () => {
  it("clears the badge when nothing is due", () => {
    expect(formatBadgeText(0)).toBe("");
  });

  it("shows the due count, capping display at 99+", () => {
    expect(formatBadgeText(3)).toBe("3");
    expect(formatBadgeText(99)).toBe("99");
    expect(formatBadgeText(100)).toBe("99+");
  });
});
