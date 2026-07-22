import {
  dueTodayCount,
  formatBadgeText,
  nextRolloverAlarmTime,
  notificationCopy,
} from "./reminders";
import { schedulingDay } from "../scheduler/dates";
import type { Clock, Rng } from "../scheduler/scheduler";
import type { StorageAdapter } from "../storage/storage-adapter";

export const DAILY_ROLLOVER_ALARM = "solvecue-daily-rollover";
export const DUE_NOTIFICATION_ID = "solvecue-due";

export interface BadgePort {
  setText(text: string): Promise<void>;
}

export interface NotificationPort {
  show(notification: {
    id: string;
    title: string;
    message: string;
  }): Promise<void>;
}

export interface AlarmPort {
  schedule(name: string, when: Date): Promise<void>;
}

export interface ReminderControllerDeps {
  storage: StorageAdapter;
  badge: BadgePort;
  notifications: NotificationPort;
  alarms: AlarmPort;
  now: Clock;
  rng: Rng;
}

export interface ReminderController {
  refreshBadge(): Promise<void>;
  ensureDailyAlarm(): Promise<void>;
  handleDailyAlarm(): Promise<void>;
  runCatchUp(): Promise<void>;
  onQueueOrSettingsChanged(): Promise<void>;
}

export function createReminderController(
  deps: ReminderControllerDeps,
): ReminderController {
  async function refreshBadge(): Promise<void> {
    const [problems, settings] = await Promise.all([
      deps.storage.listProblems(),
      deps.storage.getSettings(),
    ]);
    const count = dueTodayCount(problems, deps.now, settings, deps.rng);
    await deps.badge.setText(formatBadgeText(count));
  }

  async function ensureDailyAlarm(): Promise<void> {
    const settings = await deps.storage.getSettings();
    const when = nextRolloverAlarmTime(deps.now(), settings.dayRolloverHour);
    await deps.alarms.schedule(DAILY_ROLLOVER_ALARM, when);
  }

  async function deliverDueNotification(): Promise<void> {
    const [problems, settings] = await Promise.all([
      deps.storage.listProblems(),
      deps.storage.getSettings(),
    ]);
    const count = dueTodayCount(problems, deps.now, settings, deps.rng);
    if (count <= 0) {
      return;
    }

    const today = schedulingDay(deps.now(), settings.dayRolloverHour);
    const lastNotified = await deps.storage.getLastNotifiedDay();
    if (lastNotified === today) {
      return;
    }

    const copy = notificationCopy(count);
    await deps.notifications.show({
      id: DUE_NOTIFICATION_ID,
      title: copy.title,
      message: copy.message,
    });
    await deps.storage.setLastNotifiedDay(today);
  }

  async function syncBadgeNotifyAndAlarm(): Promise<void> {
    await refreshBadge();
    await deliverDueNotification();
    await ensureDailyAlarm();
  }

  async function onQueueOrSettingsChanged(): Promise<void> {
    await refreshBadge();
    await ensureDailyAlarm();
  }

  return {
    refreshBadge,
    ensureDailyAlarm,
    handleDailyAlarm: syncBadgeNotifyAndAlarm,
    runCatchUp: syncBadgeNotifyAndAlarm,
    onQueueOrSettingsChanged,
  };
}
