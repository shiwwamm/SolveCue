import type { Settings } from "../types/domain";
import type { StorageAdapter } from "../storage/storage-adapter";

export type SettingsUpdate = Partial<
  Pick<Settings, "dailyTargetCap" | "dayRolloverHour">
>;

export async function updateSettings(
  storage: StorageAdapter,
  changes: SettingsUpdate,
): Promise<Settings> {
  const current = await storage.getSettings();
  const next: Settings = { ...current, ...changes };
  await storage.saveSettings(next);
  return next;
}
