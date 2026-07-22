import { describe, expect, it } from "vitest";
import { updateSettings } from "../../src/settings/update-settings";
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

function createProblem(id: string): Problem {
  return {
    id,
    title: id,
    url: `https://leetcode.com/problems/${id}/`,
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
  };
}

const noFuzz = () => 0.5;
const now = () => new Date(2026, 6, 21, 12, 0, 0);

describe("updateSettings", () => {
  it("persists a new daily target cap", async () => {
    const storage = createStorageAdapter(createFakeStorage());

    const settings = await updateSettings(storage, { dailyTargetCap: 5 });

    expect(settings.dailyTargetCap).toBe(5);
    expect(settings.dayRolloverHour).toBe(DEFAULT_SETTINGS.dayRolloverHour);
    expect(await storage.getSettings()).toEqual(settings);
  });

  it("persists a new rollover hour", async () => {
    const storage = createStorageAdapter(createFakeStorage());

    const settings = await updateSettings(storage, { dayRolloverHour: 6 });

    expect(settings.dayRolloverHour).toBe(6);
    expect(settings.dailyTargetCap).toBe(DEFAULT_SETTINGS.dailyTargetCap);
    expect(await storage.getSettings()).toEqual(settings);
  });

  it("changes the today queue when the daily cap is updated", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    for (const id of ["a", "b", "c", "d"]) {
      await storage.saveProblem(createProblem(id));
    }

    const settings = await updateSettings(storage, { dailyTargetCap: 2 });
    const queue = buildTodayQueue(
      await storage.listProblems(),
      now,
      settings,
      noFuzz,
    );

    expect(queue.map((problem) => problem.id)).toEqual(["a", "b"]);
  });

  it("changes the today queue when the rollover hour is updated", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    await storage.saveProblem(createProblem("today"));

    const earlyMorning = () => new Date(2026, 6, 21, 5, 0, 0);
    const defaultQueue = buildTodayQueue(
      await storage.listProblems(),
      earlyMorning,
      DEFAULT_SETTINGS,
      noFuzz,
    );
    expect(defaultQueue.map((problem) => problem.id)).toEqual(["today"]);

    const settings = await updateSettings(storage, { dayRolloverHour: 6 });
    const queue = buildTodayQueue(
      await storage.listProblems(),
      earlyMorning,
      settings,
      noFuzz,
    );

    expect(queue).toHaveLength(0);
  });
});
