import type { Problem } from "./types/domain";

export function reviewLabel(problem: Problem, today: string): string {
  if (
    problem.reviewHistory.at(-1)?.grade === "couldnt-solve" &&
    problem.softDueDate != null &&
    problem.softDueDate <= today
  ) {
    return "Failed — due today";
  }

  if (problem.softDueDate != null && problem.softDueDate < today) {
    return `Overdue since ${problem.softDueDate}`;
  }

  return `Due today · ${problem.leetcodeTag}`;
}
