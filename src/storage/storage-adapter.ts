import {
  DEFAULT_SETTINGS,
  type Problem,
  type Settings,
} from "../types/domain";

const PROBLEMS_KEY = "problems";
const SETTINGS_KEY = "settings";
const PENDING_REVIEWS_KEY = "pendingReviews";
const LAST_NOTIFIED_DAY_KEY = "lastNotifiedDay";

export interface StorageAreaLike {
  get(
    keys: string | string[] | Record<string, unknown> | null,
  ): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export interface StorageAdapter {
  getProblem(id: string): Promise<Problem | null>;
  saveProblem(problem: Problem): Promise<void>;
  listProblems(): Promise<Problem[]>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  markPendingReview(id: string): Promise<void>;
  isPendingReview(id: string): Promise<boolean>;
  clearPendingReview(id: string): Promise<void>;
  getLastNotifiedDay(): Promise<string | null>;
  setLastNotifiedDay(day: string): Promise<void>;
}

export function createStorageAdapter(area: StorageAreaLike): StorageAdapter {
  async function readProblems(): Promise<Record<string, Problem>> {
    const result = await area.get(PROBLEMS_KEY);
    const problems = result[PROBLEMS_KEY];

    if (!problems || typeof problems !== "object") {
      return {};
    }

    return problems as Record<string, Problem>;
  }

  async function readPendingReviews(): Promise<Record<string, true>> {
    const result = await area.get(PENDING_REVIEWS_KEY);
    const pending = result[PENDING_REVIEWS_KEY];

    if (!pending || typeof pending !== "object") {
      return {};
    }

    return pending as Record<string, true>;
  }

  return {
    async getProblem(id) {
      const problems = await readProblems();
      return problems[id] ?? null;
    },

    async saveProblem(problem) {
      const problems = await readProblems();
      problems[problem.id] = problem;
      await area.set({ [PROBLEMS_KEY]: problems });
    },

    async listProblems() {
      const problems = await readProblems();
      return Object.values(problems).sort((left, right) =>
        left.title.localeCompare(right.title),
      );
    },

    async getSettings() {
      const result = await area.get(SETTINGS_KEY);
      const settings = result[SETTINGS_KEY];

      if (!settings || typeof settings !== "object") {
        return DEFAULT_SETTINGS;
      }

      return settings as Settings;
    },

    async saveSettings(settings) {
      await area.set({ [SETTINGS_KEY]: settings });
    },

    async markPendingReview(id) {
      const pending = await readPendingReviews();
      pending[id] = true;
      await area.set({ [PENDING_REVIEWS_KEY]: pending });
    },

    async isPendingReview(id) {
      const pending = await readPendingReviews();
      return pending[id] === true;
    },

    async clearPendingReview(id) {
      const pending = await readPendingReviews();
      if (!(id in pending)) {
        return;
      }

      delete pending[id];
      await area.set({ [PENDING_REVIEWS_KEY]: pending });
    },

    async getLastNotifiedDay() {
      const result = await area.get(LAST_NOTIFIED_DAY_KEY);
      const day = result[LAST_NOTIFIED_DAY_KEY];
      return typeof day === "string" ? day : null;
    },

    async setLastNotifiedDay(day) {
      await area.set({ [LAST_NOTIFIED_DAY_KEY]: day });
    },
  };
}

export function createChromeStorageAdapter(
  area: chrome.storage.StorageArea,
): StorageAdapter {
  return createStorageAdapter({
    get: (keys) => area.get(keys ?? null),
    set: (items) => area.set(items),
  });
}
