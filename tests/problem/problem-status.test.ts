import { describe, expect, it } from "vitest";
import {
  pauseProblem,
  reactivateProblem,
} from "../../src/problem/problem-status";
import { buildTodayQueue } from "../../src/scheduler/scheduler";
import type { Problem } from "../../src/types/domain";
import { DEFAULT_SETTINGS } from "../../src/types/domain";
import {
  createStorageAdapter,
  type StorageAreaLike,
} from "../../src/storage/storage-adapter";

function createFakeStorage(): StorageAreaLike {
  const data = new Map<string, unknown>();

  return {
    async get(keys) {
      const result: Record<string, unknown> = {};

      if (typeof keys === "string") {
        if (data.has(keys)) {
          result[keys] = data.get(keys);
        }
        return result;
      }

      if (Array.isArray(keys)) {
        for (const key of keys) {
          if (data.has(key)) {
            result[key] = data.get(key);
          }
        }
        return result;
      }

      if (keys && typeof keys === "object") {
        for (const [key, defaultValue] of Object.entries(keys)) {
          result[key] = data.has(key) ? data.get(key) : defaultValue;
        }
      }

      return result;
    },

    async set(items) {
      for (const [key, value] of Object.entries(items)) {
        data.set(key, value);
      }
    },
  };
}

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

const noFuzz = () => 0.5;
const now = () => new Date(2026, 6, 21, 12, 0, 0);

describe("pauseProblem", () => {
  it("sets status to paused and keeps review history", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    const original = createProblem();
    await storage.saveProblem(original);

    const paused = await pauseProblem(storage, "two-sum");

    expect(paused.status).toBe("paused");
    expect(paused.reviewHistory).toEqual(original.reviewHistory);
    expect(paused.softDueDate).toBe("2026-07-21");
    expect(await storage.getProblem("two-sum")).toEqual(paused);
  });

  it("excludes a paused problem from the today queue", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    await storage.saveProblem(createProblem({ id: "due", softDueDate: "2026-07-21" }));
    await pauseProblem(storage, "due");

    const queue = buildTodayQueue(
      await storage.listProblems(),
      now,
      DEFAULT_SETTINGS,
      noFuzz,
    );

    expect(queue).toHaveLength(0);
  });
});

describe("reactivateProblem", () => {
  it("sets status back to active and keeps review history", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    const original = createProblem({ status: "paused" });
    await storage.saveProblem(original);

    const reactivated = await reactivateProblem(storage, "two-sum");

    expect(reactivated.status).toBe("active");
    expect(reactivated.reviewHistory).toEqual(original.reviewHistory);
    expect(reactivated.softDueDate).toBe("2026-07-21");
    expect(await storage.getProblem("two-sum")).toEqual(reactivated);
  });

  it("returns a reactivated problem to the today queue when due", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    await storage.saveProblem(
      createProblem({ id: "due", status: "paused", softDueDate: "2026-07-21" }),
    );
    await reactivateProblem(storage, "due");

    const queue = buildTodayQueue(
      await storage.listProblems(),
      now,
      DEFAULT_SETTINGS,
      noFuzz,
    );

    expect(queue.map((problem) => problem.id)).toEqual(["due"]);
  });
});
