import {
  DEFAULT_SETTINGS,
  type Problem,
  type Settings,
} from "../types/domain";

const PROBLEMS_KEY = "problems";
const SETTINGS_KEY = "settings";

export interface StorageAreaLike {
  get(
    keys: string | string[] | Record<string, unknown> | null,
  ): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export interface StorageAdapter {
  getProblem(id: string): Promise<Problem | null>;
  saveProblem(problem: Problem): Promise<void>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
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
