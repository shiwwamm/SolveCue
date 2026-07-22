import { describe, expect, it, vi } from "vitest";
import {
  DAILY_ROLLOVER_ALARM,
  createReminderController,
  type AlarmPort,
  type BadgePort,
  type NotificationPort,
} from "../../src/reminders/reminder-controller";
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

function createPorts() {
  const badge: BadgePort = {
    setText: vi.fn(async () => undefined),
  };
  const notifications: NotificationPort = {
    show: vi.fn(async () => undefined),
  };
  const alarms: AlarmPort = {
    schedule: vi.fn(async () => undefined),
  };
  return { badge, notifications, alarms };
}

describe("reminder controller", () => {
  it("updates the badge to today's due count without notifying", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    await storage.saveProblem(createProblem({ id: "a" }));
    await storage.saveProblem(createProblem({ id: "b", softDueDate: "2026-07-23" }));

    const ports = createPorts();
    const now = () => new Date(2026, 6, 22, 12, 0, 0);
    const controller = createReminderController({
      storage,
      ...ports,
      now,
      rng: () => 0.5,
    });

    await controller.refreshBadge();

    expect(ports.badge.setText).toHaveBeenCalledWith("1");
    expect(ports.notifications.show).not.toHaveBeenCalled();
  });

  it("clears the badge when nothing is due", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    const ports = createPorts();
    const controller = createReminderController({
      storage,
      ...ports,
      now: () => new Date(2026, 6, 22, 12, 0, 0),
      rng: () => 0.5,
    });

    await controller.refreshBadge();

    expect(ports.badge.setText).toHaveBeenCalledWith("");
  });

  it("on daily alarm: updates badge, notifies when due, and reschedules next rollover", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    await storage.saveProblem(createProblem());

    const ports = createPorts();
    const now = () => new Date(2026, 6, 22, 4, 0, 0);
    const controller = createReminderController({
      storage,
      ...ports,
      now,
      rng: () => 0.5,
    });

    await controller.handleDailyAlarm();

    expect(ports.badge.setText).toHaveBeenCalledWith("1");
    expect(ports.notifications.show).toHaveBeenCalledWith({
      id: "solvecue-due",
      title: "SolveCue",
      message: "1 review due today",
    });
    expect(ports.alarms.schedule).toHaveBeenCalledWith(
      DAILY_ROLLOVER_ALARM,
      new Date(2026, 6, 23, 4, 0, 0),
    );
    expect(await storage.getLastNotifiedDay()).toBe("2026-07-22");
  });

  it("on startup catch-up: surfaces due reviews missed while Chrome was closed", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    await storage.saveProblem(createProblem({ softDueDate: "2026-07-21" }));

    const ports = createPorts();
    const now = () => new Date(2026, 6, 22, 10, 0, 0);
    const controller = createReminderController({
      storage,
      ...ports,
      now,
      rng: () => 0.5,
    });

    await controller.runCatchUp();

    expect(ports.badge.setText).toHaveBeenCalledWith("1");
    expect(ports.notifications.show).toHaveBeenCalledWith({
      id: "solvecue-due",
      title: "SolveCue",
      message: "1 review due today",
    });
    expect(ports.alarms.schedule).toHaveBeenCalledWith(
      DAILY_ROLLOVER_ALARM,
      new Date(2026, 6, 23, 4, 0, 0),
    );
  });

  it("does not re-notify for the same scheduling day", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    await storage.saveProblem(createProblem());
    await storage.setLastNotifiedDay("2026-07-22");

    const ports = createPorts();
    const controller = createReminderController({
      storage,
      ...ports,
      now: () => new Date(2026, 6, 22, 10, 0, 0),
      rng: () => 0.5,
    });

    await controller.runCatchUp();

    expect(ports.badge.setText).toHaveBeenCalledWith("1");
    expect(ports.notifications.show).not.toHaveBeenCalled();
  });

  it("does not notify when the queue is empty", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    const ports = createPorts();
    const controller = createReminderController({
      storage,
      ...ports,
      now: () => new Date(2026, 6, 22, 4, 0, 0),
      rng: () => 0.5,
    });

    await controller.handleDailyAlarm();

    expect(ports.notifications.show).not.toHaveBeenCalled();
    expect(ports.badge.setText).toHaveBeenCalledWith("");
  });

  it("schedules the next rollover alarm using the configured hour", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    await storage.saveSettings({
      dailyTargetCap: 8,
      dayRolloverHour: 5,
      timezone: "local",
    });

    const ports = createPorts();
    const controller = createReminderController({
      storage,
      ...ports,
      now: () => new Date(2026, 6, 22, 2, 0, 0),
      rng: () => 0.5,
    });

    await controller.ensureDailyAlarm();

    expect(ports.alarms.schedule).toHaveBeenCalledWith(
      DAILY_ROLLOVER_ALARM,
      new Date(2026, 6, 22, 5, 0, 0),
    );
  });

  it("on settings/queue change: refreshes badge and reschedules the rollover alarm", async () => {
    const storage = createStorageAdapter(createFakeStorage());
    await storage.saveProblem(createProblem({ softDueDate: "2026-07-21" }));
    await storage.saveSettings({
      dailyTargetCap: 8,
      dayRolloverHour: 6,
      timezone: "local",
    });

    const ports = createPorts();
    const controller = createReminderController({
      storage,
      ...ports,
      now: () => new Date(2026, 6, 22, 5, 0, 0),
      rng: () => 0.5,
    });

    await controller.onQueueOrSettingsChanged();

    expect(ports.badge.setText).toHaveBeenCalledWith("1");
    expect(ports.alarms.schedule).toHaveBeenCalledWith(
      DAILY_ROLLOVER_ALARM,
      new Date(2026, 6, 22, 6, 0, 0),
    );
    expect(ports.notifications.show).not.toHaveBeenCalled();
  });
});
