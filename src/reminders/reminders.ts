import {
  buildTodayQueue,
  type Clock,
  type Rng,
} from "../scheduler/scheduler";
import type { Problem, Settings } from "../types/domain";

export function dueTodayCount(
  problems: Problem[],
  now: Clock,
  settings: Settings,
  rng: Rng,
): number {
  return buildTodayQueue(problems, now, settings, rng).length;
}

export function nextRolloverAlarmTime(now: Date, rolloverHour: number): Date {
  const candidate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    rolloverHour,
    0,
    0,
    0,
  );

  if (now < candidate) {
    return candidate;
  }

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    rolloverHour,
    0,
    0,
    0,
  );
}

export function formatBadgeText(count: number): string {
  if (count <= 0) {
    return "";
  }

  if (count > 99) {
    return "99+";
  }

  return String(count);
}

export function notificationCopy(count: number): {
  title: string;
  message: string;
} {
  const noun = count === 1 ? "review" : "reviews";
  return {
    title: "SolveCue",
    message: `${count} ${noun} due today`,
  };
}
