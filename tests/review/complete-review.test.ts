import { describe, expect, it } from "vitest";
import { completeReview } from "../../src/review/complete-review";
import {
  createStorageAdapter,
  type StorageAreaLike,
} from "../../src/storage/storage-adapter";
import type { Problem } from "../../src/types/domain";

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

const fixedNow = () => new Date("2026-07-21T12:00:00.000Z");
const noFuzz = () => 0.5;

function createProblem(overrides: Partial<Problem> = {}): Problem {
  return {
    id: "two-sum",
    title: "Two Sum",
    url: "https://leetcode.com/problems/two-sum/",
    leetcodeTag: "Easy",
    addedAt: "2026-07-14T12:00:00.000Z",
    lastReviewedAt: "2026-07-14T12:00:00.000Z",
    reviewHistory: [{ date: "2026-07-14T12:00:00.000Z", grade: "easy" }],
    easeFactor: 2.45,
    currentInterval: 7,
    repetitions: 1,
    softDueDate: "2026-07-21",
    hardDueDate: "2026-07-24",
    status: "active",
    ...overrides,
  };
}

describe("completeReview", () => {
  it("re-grades via review() and appends { date, grade } to history", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    await storage.saveProblem(createProblem());
    await storage.markPendingReview("two-sum");

    const result = await completeReview(
      storage,
      "two-sum",
      "easy",
      fixedNow,
      noFuzz,
    );

    expect(result.currentInterval).toBe(14);
    expect(result.softDueDate).toBe("2026-08-04");
    expect(result.reviewHistory).toEqual([
      { date: "2026-07-14T12:00:00.000Z", grade: "easy" },
      { date: "2026-07-21T12:00:00.000Z", grade: "easy" },
    ]);
    expect(await storage.getProblem("two-sum")).toEqual(result);
    expect(await storage.isPendingReview("two-sum")).toBe(false);
  });

  it("reschedules failures for tomorrow without fuzz", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    await storage.saveProblem(createProblem());

    const result = await completeReview(
      storage,
      "two-sum",
      "couldnt-solve",
      fixedNow,
      () => 0.9,
    );

    expect(result.currentInterval).toBe(1);
    expect(result.softDueDate).toBe("2026-07-22");
    expect(result.reviewHistory.at(-1)).toEqual({
      date: "2026-07-21T12:00:00.000Z",
      grade: "couldnt-solve",
    });
  });

  it("rejects completing a review for an unknown problem", async () => {
    const storage = createStorageAdapter(createFakeStorage());

    await expect(
      completeReview(storage, "missing", "solid", fixedNow, noFuzz),
    ).rejects.toThrow(/unknown problem/);
  });

  it("never stores solution code on the problem record", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    await storage.saveProblem(createProblem());

    const result = await completeReview(
      storage,
      "two-sum",
      "solid",
      fixedNow,
      noFuzz,
    );

    expect(result).not.toHaveProperty("solution");
    expect(result).not.toHaveProperty("code");
    expect(JSON.stringify(result)).not.toMatch(/function\s*\(|class\s+\w+/);
  });
});
