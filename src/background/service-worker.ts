import {
  createReminderController,
  DAILY_ROLLOVER_ALARM,
  type AlarmPort,
  type BadgePort,
  type NotificationPort,
} from "../reminders/reminder-controller";
import { createChromeStorageAdapter } from "../storage/storage-adapter";

const storage = createChromeStorageAdapter(chrome.storage.local);

const badge: BadgePort = {
  async setText(text) {
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color: "#2563eb" });
  },
};

const notifications: NotificationPort = {
  async show({ id, title, message }) {
    await chrome.notifications.create(id, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title,
      message,
      priority: 2,
    });
  },
};

const alarms: AlarmPort = {
  async schedule(name, when) {
    await chrome.alarms.create(name, { when: when.getTime() });
  },
};

const reminders = createReminderController({
  storage,
  badge,
  notifications,
  alarms,
  now: () => new Date(),
  rng: Math.random,
});

async function bootstrap(): Promise<void> {
  await reminders.runCatchUp();
}

chrome.runtime.onInstalled.addListener(() => {
  void bootstrap();
});

chrome.runtime.onStartup.addListener(() => {
  void reminders.runCatchUp();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== DAILY_ROLLOVER_ALARM) {
    return;
  }

  void reminders.handleDailyAlarm();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  if (!("problems" in changes) && !("settings" in changes)) {
    return;
  }

  void reminders.onQueueOrSettingsChanged();
});

void bootstrap();
