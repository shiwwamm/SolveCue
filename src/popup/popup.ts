import { createChromeStorageAdapter } from "../storage/storage-adapter";
import type { Problem } from "../types/domain";

const storage = createChromeStorageAdapter(chrome.storage.local);

function renderProblemList(problems: Problem[]): void {
  const list = document.getElementById("problem-list");
  const emptyState = document.getElementById("empty-state");

  if (!list || !emptyState) {
    return;
  }

  list.replaceChildren();

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

    const meta = document.createElement("div");
    meta.className = "problem-meta";
    meta.textContent = `Next review: ${problem.softDueDate ?? "unscheduled"} · ${problem.leetcodeTag}`;

    item.append(title, meta);
    list.appendChild(item);
  }
}

async function loadProblems(): Promise<void> {
  const problems = await storage.listProblems();
  renderProblemList(problems);
}

void loadProblems();
