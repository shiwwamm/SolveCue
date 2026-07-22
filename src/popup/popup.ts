import { pauseProblem, reactivateProblem } from "../problem/problem-status";
import { createChromeStorageAdapter } from "../storage/storage-adapter";
import { updateSettings } from "../settings/update-settings";
import { schedulingDay } from "../scheduler/dates";
import { buildTodayQueue } from "../scheduler/scheduler";
import { reviewLabel } from "../review-label";
import type { Problem, Settings } from "../types/domain";

const storage = createChromeStorageAdapter(chrome.storage.local);

const dailyCapInput = document.getElementById("daily-cap") as HTMLInputElement;
const rolloverHourInput = document.getElementById(
  "rollover-hour",
) as HTMLInputElement;

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

    const header = document.createElement("div");
    header.className = "problem-header";

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

    const pauseButton = document.createElement("button");
    pauseButton.type = "button";
    pauseButton.className = "problem-action";
    pauseButton.textContent = "Pause";
    pauseButton.addEventListener("click", () => {
      void pauseProblem(storage, problem.id).then(() => loadPopup());
    });

    header.append(title, pauseButton);

    const meta = document.createElement("div");
    meta.className = "problem-meta";
    meta.textContent = reviewLabel(problem, today);

    item.append(header, meta);
    list.appendChild(item);
  }
}

function renderPausedProblems(problems: Problem[]): void {
  const section = document.getElementById("paused-section");
  const list = document.getElementById("paused-list");

  if (!section || !list) {
    return;
  }

  list.replaceChildren();

  if (problems.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;

  for (const problem of problems) {
    const item = document.createElement("li");
    item.className = "problem-item";

    const header = document.createElement("div");
    header.className = "problem-header";

    const title = document.createElement("span");
    title.className = "problem-title paused-title";
    title.textContent = problem.title;

    const reactivateButton = document.createElement("button");
    reactivateButton.type = "button";
    reactivateButton.className = "problem-action";
    reactivateButton.textContent = "Reactivate";
    reactivateButton.addEventListener("click", () => {
      void reactivateProblem(storage, problem.id).then(() => loadPopup());
    });

    header.append(title, reactivateButton);
    item.appendChild(header);
    list.appendChild(item);
  }
}

function renderSettings(settings: Settings): void {
  dailyCapInput.value = String(settings.dailyTargetCap);
  rolloverHourInput.value = String(settings.dayRolloverHour);
}

async function loadPopup(): Promise<void> {
  const [problems, settings] = await Promise.all([
    storage.listProblems(),
    storage.getSettings(),
  ]);
  const now = () => new Date();
  const today = schedulingDay(now(), settings.dayRolloverHour);
  const queue = buildTodayQueue(problems, now, settings, Math.random);
  const paused = problems.filter((problem) => problem.status === "paused");

  renderSettings(settings);
  renderTodayQueue(queue, today);
  renderPausedProblems(paused);
}

function readSettingsFromForm(): {
  dailyTargetCap: number;
  dayRolloverHour: number;
} {
  return {
    dailyTargetCap: Number(dailyCapInput.value),
    dayRolloverHour: Number(rolloverHourInput.value),
  };
}

function bindSettingsForm(): void {
  const save = (): void => {
    const next = readSettingsFromForm();
    if (
      !Number.isFinite(next.dailyTargetCap) ||
      !Number.isFinite(next.dayRolloverHour)
    ) {
      return;
    }

    void updateSettings(storage, next).then(() => loadPopup());
  };

  dailyCapInput.addEventListener("change", save);
  rolloverHourInput.addEventListener("change", save);
}

bindSettingsForm();
void loadPopup();
