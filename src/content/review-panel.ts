import { isReviewPanelDismissed } from "../review-panel-dismiss";
import { reviewLabel } from "../review-label";
import { schedulingDay } from "../scheduler/dates";
import { buildTodayQueue } from "../scheduler/scheduler";
import { createChromeStorageAdapter } from "../storage/storage-adapter";
import type { Problem, ReviewPanelDismissState } from "../types/domain";

const ROOT_ID = "solvecue-review-root";
const REVIEW_PANEL_DISMISS_KEY = "reviewPanelDismiss";

const storage = createChromeStorageAdapter(chrome.storage.local);

function removePanel(): void {
  document.getElementById(ROOT_ID)?.remove();
}

async function readDismissState(): Promise<ReviewPanelDismissState | null> {
  const result = await chrome.storage.local.get(REVIEW_PANEL_DISMISS_KEY);
  const dismissState = result[REVIEW_PANEL_DISMISS_KEY];

  if (!dismissState || typeof dismissState !== "object") {
    return null;
  }

  const { schedulingDay, queueIds } = dismissState as ReviewPanelDismissState;

  if (
    typeof schedulingDay !== "string" ||
    !Array.isArray(queueIds) ||
    !queueIds.every((id) => typeof id === "string")
  ) {
    return null;
  }

  return { schedulingDay, queueIds };
}

async function saveDismissState(
  dismissState: ReviewPanelDismissState,
): Promise<void> {
  await chrome.storage.local.set({
    [REVIEW_PANEL_DISMISS_KEY]: dismissState,
  });
}

function renderPanel(
  queue: Problem[],
  today: string,
  onDismiss: () => void,
): void {
  removePanel();

  if (queue.length === 0) {
    return;
  }

  const root = document.createElement("div");
  root.id = ROOT_ID;

  const panel = document.createElement("div");
  panel.className = "solvecue-review-panel";

  const header = document.createElement("div");
  header.className = "solvecue-review-header";

  const heading = document.createElement("span");
  heading.className = "solvecue-review-heading";
  heading.textContent = `${queue.length} due today`;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "solvecue-review-close";
  closeButton.setAttribute("aria-label", "Dismiss SolveCue review panel");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => {
    void onDismiss();
  });

  header.append(heading, closeButton);

  const list = document.createElement("ul");
  list.className = "solvecue-review-list";

  for (const problem of queue) {
    const item = document.createElement("li");
    item.className = "solvecue-review-item";

    const link = document.createElement("a");
    link.className = "solvecue-review-link";
    link.href = problem.url;
    link.textContent = problem.title;

    const meta = document.createElement("span");
    meta.className = "solvecue-review-meta";
    meta.textContent = reviewLabel(problem, today);

    item.append(link, meta);
    list.appendChild(item);
  }

  panel.append(header, list);
  root.appendChild(panel);
  document.body.appendChild(root);
}

async function loadAndRender(): Promise<void> {
  const [problems, settings, dismissState] = await Promise.all([
    storage.listProblems(),
    storage.getSettings(),
    readDismissState(),
  ]);
  const now = () => new Date();
  const today = schedulingDay(now(), settings.dayRolloverHour);
  const queue = buildTodayQueue(problems, now, settings, Math.random);
  const queueIds = queue.map((problem) => problem.id);

  removePanel();

  if (queue.length === 0) {
    return;
  }

  if (isReviewPanelDismissed(dismissState, queueIds, today)) {
    return;
  }

  renderPanel(queue, today, async () => {
    await saveDismissState({ schedulingDay: today, queueIds });
    removePanel();
  });
}

export function mountReviewPanel(): void {
  void loadAndRender();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (
      "problems" in changes ||
      "settings" in changes ||
      REVIEW_PANEL_DISMISS_KEY in changes
    ) {
      void loadAndRender();
    }
  });
}
