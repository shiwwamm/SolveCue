import { describe, expect, it } from "vitest";
import type { Problem, Settings } from "../../src/types/domain";
import {
  createStorageAdapter,
  type StorageAreaLike,
} from "../../src/storage/storage-adapter";

function createFakeStorage(): StorageAreaLike {
  const data = new Map<string, unknown>();

  return {
    async get(keys) {
      const result: Record<string, unknown> = {};

      if (keys === null) {
        for (const [key, value] of data.entries()) {
          result[key] = value;
        }
        return result;
      }

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

      for (const [key, defaultValue] of Object.entries(keys)) {
        result[key] = data.has(key) ? data.get(key) : defaultValue;
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

const sampleProblem: Problem = {
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
};

const sampleSettings: Settings = {
  dailyTargetCap: 10,
  dayRolloverHour: 4,
  timezone: "America/New_York",
};

describe("storage adapter", () => {
  it("persists and reads back a Problem", async () => {
    const storage = createStorageAdapter(createFakeStorage());

    await storage.saveProblem(sampleProblem);
    const retrieved = await storage.getProblem("two-sum");

    expect(retrieved).toEqual(sampleProblem);
  });

  it("persists and reads back Settings", async () => {
    const storage = createStorageAdapter(createFakeStorage());

    await storage.saveSettings(sampleSettings);
    const retrieved = await storage.getSettings();

    expect(retrieved).toEqual(sampleSettings);
  });
});
