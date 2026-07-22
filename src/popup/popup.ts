import { createChromeStorageAdapter } from "../storage/storage-adapter";
import { schedulingDay } from "../scheduler/dates";
import { buildTodayQueue } from "../scheduler/scheduler";
import type { Problem } from "../types/domain";

const storage = createChromeStorageAdapter(chrome.storage.local);

function reviewLabel(problem: Problem, today: string): string {
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

function renderTodayQueue(problems: Problem[], today: string): void {
  const list = document.getElementById("problem-list");
  const emptyState = document.getElementById("empty-state");
  const countLabel = document.getElementById("queue-count");

  if (!list || !emptyState) {
    return;
  }

  list.replaceChildren();

  if (countLabel) {
    countLabel.textContent =
      problems.length === 0
        ? "Nothing due today"
        : `${problems.length} due today`;
  }

  if (problems.length === 0) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  for (const problem of problems) {
    const item = document.createElement("li");
    item.className = "problem-item";

    const title = document.createElement("a");
    title.className = "problem-title";
    title.href = problem.url;
    title.textContent = problem.title;
    title.target = "_blank";
    title.rel = "noreferrer";
    title.addEventListener("click", (event) => {
      event.preventDefault();
      void storage.markPendingReview(problem.id).then(() => {
        window.open(problem.url, "_blank", "noreferrer");
      });
    });

    const meta = document.createElement("div");
    meta.className = "problem-meta";
    meta.textContent = reviewLabel(problem, today);

    item.append(title, meta);
    list.appendChild(item);
  }
}

async function loadTodayQueue(): Promise<void> {
  const [problems, settings] = await Promise.all([
    storage.listProblems(),
    storage.getSettings(),
  ]);
  const now = () => new Date();
  const today = schedulingDay(now(), settings.dayRolloverHour);
  const queue = buildTodayQueue(problems, now, settings, Math.random);

  renderTodayQueue(queue, today);
}

void loadTodayQueue();
