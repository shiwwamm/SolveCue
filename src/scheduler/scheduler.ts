import {
  addCalendarDays,
  eachCalendarDay,
  schedulingDay,
} from "./dates";
import type { Problem, Settings } from "../types/domain";

export type Clock = () => Date;
export type Rng = () => number;

export { review } from "./review";

const FAILURE_CAP_FLEX = 2;

function isFailure(problem: Problem): boolean {
  const lastReview = problem.reviewHistory[problem.reviewHistory.length - 1];
  return lastReview?.grade === "couldnt-solve";
}

export function placeReview(
  problem: Problem,
  calendarLoad: Record<string, number>,
  cap: number,
  now: Clock,
  _rng: Rng,
): Problem {
  if (isFailure(problem)) {
    return {
      ...problem,
      softDueDate: addCalendarDays(now(), 1),
    };
  }

  const softDueDate = problem.softDueDate;
  const hardDueDate = problem.hardDueDate;

  if (!softDueDate || !hardDueDate) {
    return problem;
  }

  if ((calendarLoad[softDueDate] ?? 0) < cap) {
    return { ...problem, softDueDate };
  }

  for (const day of eachCalendarDay(softDueDate, hardDueDate)) {
    if ((calendarLoad[day] ?? 0) < cap) {
      return { ...problem, softDueDate: day };
    }
  }

  let leastLoadedDay = softDueDate;
  let leastLoad = Number.POSITIVE_INFINITY;

  for (const day of eachCalendarDay(softDueDate, hardDueDate)) {
    const load = calendarLoad[day] ?? 0;
    if (load < leastLoad) {
      leastLoad = load;
      leastLoadedDay = day;
    }
  }

  return { ...problem, softDueDate: leastLoadedDay };
}

export function buildCalendarLoad(
  problems: Problem[],
): Record<string, number> {
  const load: Record<string, number> = {};

  for (const problem of problems) {
    if (problem.status !== "active" || !problem.softDueDate) {
      continue;
    }

    load[problem.softDueDate] = (load[problem.softDueDate] ?? 0) + 1;
  }

  return load;
}

export function buildTodayQueue(
  problems: Problem[],
  now: Clock,
  settings: Settings,
  _rng: Rng,
): Problem[] {
  const today = schedulingDay(now(), settings.dayRolloverHour);
  const cap = settings.dailyTargetCap;

  const due = problems.filter((problem) => {
    if (problem.status !== "active") {
      return false;
    }

    const softDue = problem.softDueDate;
    const hardDue = problem.hardDueDate;

    return (
      (softDue != null && softDue <= today) ||
      (hardDue != null && hardDue <= today)
    );
  });

  const failures: Problem[] = [];
  const overdue: Problem[] = [];
  const normal: Problem[] = [];

  for (const problem of due) {
    if (isFailure(problem)) {
      failures.push(problem);
    } else if (problem.softDueDate != null && problem.softDueDate < today) {
      overdue.push(problem);
    } else {
      normal.push(problem);
    }
  }

  const byMostOverdueThenId = (left: Problem, right: Problem): number => {
    const leftDue = left.softDueDate ?? "";
    const rightDue = right.softDueDate ?? "";
    return leftDue.localeCompare(rightDue) || left.id.localeCompare(right.id);
  };

  failures.sort(byMostOverdueThenId);
  overdue.sort(byMostOverdueThenId);
  normal.sort(byMostOverdueThenId);

  const ordered = [...failures, ...overdue, ...normal];
  const queue: Problem[] = [];
  let count = 0;

  for (const problem of ordered) {
    const hardDeadlineDue =
      problem.hardDueDate != null && problem.hardDueDate <= today;
    const failure = isFailure(problem);

    if (count < cap) {
      queue.push(problem);
      count += 1;
      continue;
    }

    if (failure && count < cap + FAILURE_CAP_FLEX) {
      queue.push(problem);
      count += 1;
      continue;
    }

    if (hardDeadlineDue) {
      queue.push(problem);
      count += 1;
    }
  }

  return queue;
}
