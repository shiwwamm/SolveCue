import { describe, expect, it } from "vitest";
import { captureProblem } from "../../src/capture/capture-problem";
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

const fixedNow = () => new Date("2026-07-21T12:00:00.000Z");
const noFuzz = () => 0.5;

describe("captureProblem", () => {
  it("stores a newly captured problem", async () => {
    const storage = createStorageAdapter(createFakeStorage());

    const problem = await captureProblem(
      storage,
      {
        id: "two-sum",
        title: "Two Sum",
        url: "https://leetcode.com/problems/two-sum/",
        leetcodeTag: "Easy",
      },
      "easy",
      fixedNow,
      noFuzz,
    );

    expect(problem.currentInterval).toBe(7);
    expect(await storage.getProblem("two-sum")).toEqual(problem);
  });

  it("updates an existing slug instead of creating a duplicate", async () => {
    const storage = createStorageAdapter(createFakeStorage());

    await captureProblem(
      storage,
      {
        id: "two-sum",
        title: "Two Sum",
        url: "https://leetcode.com/problems/two-sum/",
        leetcodeTag: "Easy",
      },
      "easy",
      fixedNow,
      noFuzz,
    );

    const updated = await captureProblem(
      storage,
      {
        id: "two-sum",
        title: "Two Sum",
        url: "https://leetcode.com/problems/two-sum/",
        leetcodeTag: "Easy",
      },
      "couldnt-solve",
      fixedNow,
      noFuzz,
    );

    const all = await storage.listProblems();

    expect(all).toHaveLength(1);
    expect(updated.currentInterval).toBe(1);
    expect(updated.reviewHistory).toHaveLength(2);
  });

  it("reschedules from prior history when re-captured with a new grade", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    const input = {
      id: "two-sum",
      title: "Two Sum",
      url: "https://leetcode.com/problems/two-sum/",
      leetcodeTag: "Easy" as const,
    };

    await captureProblem(storage, input, "easy", fixedNow, noFuzz);

    const updated = await captureProblem(
      storage,
      input,
      "easy",
      () => new Date("2026-07-28T12:00:00.000Z"),
      noFuzz,
    );

    expect(updated.currentInterval).toBe(14);
    expect(updated.reviewHistory).toHaveLength(2);
  });
});
