import { describe, expect, it } from "vitest";
import { buildTodayQueue } from "../../src/scheduler/scheduler";
import type { Problem, Settings } from "../../src/types/domain";
import { DEFAULT_SETTINGS } from "../../src/types/domain";

const noFuzz = () => 0.5;

function createProblem(overrides: Partial<Problem> = {}): Problem {
  return {
    id: "two-sum",
    title: "Two Sum",
    url: "https://leetcode.com/problems/two-sum/",
    leetcodeTag: "Easy",
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

const settings: Settings = {
  ...DEFAULT_SETTINGS,
  dailyTargetCap: 3,
  dayRolloverHour: 4,
};

describe("buildTodayQueue", () => {
  it("orders failures first, then most-overdue, then normal due today", () => {
    const now = () => new Date(2026, 6, 21, 12, 0, 0);
    const problems = [
      createProblem({
        id: "normal",
        title: "Normal",
        softDueDate: "2026-07-21",
        reviewHistory: [{ date: "2026-07-14T12:00:00.000Z", grade: "solid" }],
      }),
      createProblem({
        id: "overdue-old",
        title: "Overdue Old",
        softDueDate: "2026-07-18",
        reviewHistory: [{ date: "2026-07-11T12:00:00.000Z", grade: "solid" }],
      }),
      createProblem({
        id: "failure",
        title: "Failure",
        softDueDate: "2026-07-21",
        currentInterval: 1,
        repetitions: 0,
        reviewHistory: [
          { date: "2026-07-20T12:00:00.000Z", grade: "couldnt-solve" },
        ],
      }),
      createProblem({
        id: "overdue-recent",
        title: "Overdue Recent",
        softDueDate: "2026-07-19",
        reviewHistory: [{ date: "2026-07-12T12:00:00.000Z", grade: "solid" }],
      }),
    ];

    const queue = buildTodayQueue(problems, now, settings, noFuzz);

    expect(queue.map((problem) => problem.id)).toEqual([
      "failure",
      "overdue-old",
      "overdue-recent",
    ]);
  });

  it("enforces the daily cap and leaves overflow for later days", () => {
    const now = () => new Date(2026, 6, 21, 12, 0, 0);
    const problems = [
      createProblem({ id: "a", title: "A", softDueDate: "2026-07-21" }),
      createProblem({ id: "b", title: "B", softDueDate: "2026-07-21" }),
      createProblem({ id: "c", title: "C", softDueDate: "2026-07-21" }),
      createProblem({ id: "d", title: "D", softDueDate: "2026-07-21" }),
    ];

    const queue = buildTodayQueue(problems, now, settings, noFuzz);

    expect(queue).toHaveLength(3);
    expect(queue.map((problem) => problem.id)).toEqual(["a", "b", "c"]);
  });

  it("counts overdue toward the cap with most-overdue preferred", () => {
    const now = () => new Date(2026, 6, 21, 12, 0, 0);
    const problems = [
      createProblem({ id: "old", title: "Old", softDueDate: "2026-07-10" }),
      createProblem({ id: "mid", title: "Mid", softDueDate: "2026-07-15" }),
      createProblem({ id: "new", title: "New", softDueDate: "2026-07-20" }),
      createProblem({ id: "today", title: "Today", softDueDate: "2026-07-21" }),
    ];

    const queue = buildTodayQueue(problems, now, settings, noFuzz);

    expect(queue.map((problem) => problem.id)).toEqual(["old", "mid", "new"]);
  });

  it("excludes paused problems from the today queue", () => {
    const now = () => new Date(2026, 6, 21, 12, 0, 0);
    const problems = [
      createProblem({
        id: "paused",
        title: "Paused",
        softDueDate: "2026-07-21",
        status: "paused",
      }),
      createProblem({ id: "active", title: "Active", softDueDate: "2026-07-21" }),
    ];

    const queue = buildTodayQueue(problems, now, settings, noFuzz);

    expect(queue.map((problem) => problem.id)).toEqual(["active"]);
  });

  it("excludes problems scheduled for a future day", () => {
    const now = () => new Date(2026, 6, 21, 12, 0, 0);
    const problems = [
      createProblem({ id: "future", title: "Future", softDueDate: "2026-07-22" }),
      createProblem({ id: "today", title: "Today", softDueDate: "2026-07-21" }),
    ];

    const queue = buildTodayQueue(problems, now, settings, noFuzz);

    expect(queue.map((problem) => problem.id)).toEqual(["today"]);
  });

  it("keeps hard-deadline reviews even when they would exceed the cap", () => {
    const now = () => new Date(2026, 6, 21, 12, 0, 0);
    const problems = [
      createProblem({
        id: "a",
        title: "A",
        softDueDate: "2026-07-21",
        hardDueDate: "2026-07-28",
      }),
      createProblem({
        id: "b",
        title: "B",
        softDueDate: "2026-07-21",
        hardDueDate: "2026-07-28",
      }),
      createProblem({
        id: "c",
        title: "C",
        softDueDate: "2026-07-21",
        hardDueDate: "2026-07-28",
      }),
      createProblem({
        id: "hard",
        title: "Hard Deadline",
        softDueDate: "2026-07-21",
        hardDueDate: "2026-07-21",
      }),
    ];

    const queue = buildTodayQueue(problems, now, settings, noFuzz);

    expect(queue.map((problem) => problem.id)).toEqual(["a", "b", "c", "hard"]);
  });

  it("uses the rollover hour so 3 AM still belongs to the previous day", () => {
    const beforeRollover = () => new Date(2026, 6, 21, 3, 0, 0);
    const problems = [
      createProblem({
        id: "yesterday",
        title: "Yesterday",
        softDueDate: "2026-07-20",
      }),
      createProblem({
        id: "today-label",
        title: "Calendar Today",
        softDueDate: "2026-07-21",
      }),
    ];

    const queue = buildTodayQueue(problems, beforeRollover, settings, noFuzz);

    expect(queue.map((problem) => problem.id)).toEqual(["yesterday"]);
  });

  it("rolls to the new scheduling day at and after the rollover hour", () => {
    const atRollover = () => new Date(2026, 6, 21, 4, 0, 0);
    const problems = [
      createProblem({
        id: "yesterday",
        title: "Yesterday",
        softDueDate: "2026-07-20",
      }),
      createProblem({
        id: "today-label",
        title: "Calendar Today",
        softDueDate: "2026-07-21",
      }),
    ];

    const queue = buildTodayQueue(problems, atRollover, settings, noFuzz);

    expect(queue.map((problem) => problem.id)).toEqual([
      "yesterday",
      "today-label",
    ]);
  });

  it("lets failures flex the daily cap before rolling the rest forward", () => {
    const now = () => new Date(2026, 6, 21, 12, 0, 0);
    const failure = (id: string): Problem =>
      createProblem({
        id,
        title: id,
        softDueDate: "2026-07-21",
        currentInterval: 1,
        repetitions: 0,
        reviewHistory: [
          { date: "2026-07-20T12:00:00.000Z", grade: "couldnt-solve" },
        ],
      });

    const problems = [
      failure("f1"),
      failure("f2"),
      failure("f3"),
      failure("f4"),
      failure("f5"),
      createProblem({ id: "normal", title: "Normal", softDueDate: "2026-07-21" }),
    ];

    // cap 3 + failure flex 2 = 5 failures shown; normal rolls forward
    const queue = buildTodayQueue(problems, now, settings, noFuzz);

    expect(queue.map((problem) => problem.id)).toEqual([
      "f1",
      "f2",
      "f3",
      "f4",
      "f5",
    ]);
  });
});
