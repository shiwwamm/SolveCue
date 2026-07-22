import { captureProblem } from "../capture/capture-problem";
import { completeReview } from "../review/complete-review";
import { createChromeStorageAdapter } from "../storage/storage-adapter";
import type { Grade } from "../types/domain";
import "./content-script.css";
import {
  parseLeetCodeTag,
  parseProblemSlug,
  parseProblemTitle,
} from "./parse-problem-page";
import { mountReviewPanel } from "./review-panel";
import { resetToDefaultCode } from "./reset-editor";

const GRADE_OPTIONS: Array<{ grade: Grade; label: string }> = [
  { grade: "couldnt-solve", label: "Couldn't solve" },
  { grade: "struggled", label: "Struggled" },
  { grade: "solid", label: "Solid" },
  { grade: "easy", label: "Easy" },
];

const storage = createChromeStorageAdapter(chrome.storage.local);
let mountedSlug: string | null = null;

function currentSlug(): string | null {
  return parseProblemSlug(window.location.pathname);
}

function createGradePicker(
  promptText: string,
  onGrade: (grade: Grade) => Promise<void>,
): HTMLDivElement {
  const gradePicker = document.createElement("div");
  gradePicker.className = "solvecue-grade-picker";

  const prompt = document.createElement("p");
  prompt.textContent = promptText;
  gradePicker.appendChild(prompt);

  for (const option of GRADE_OPTIONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "solvecue-grade-button";
    button.textContent = option.label;
    button.addEventListener("click", () => {
      void onGrade(option.grade);
    });
    gradePicker.appendChild(button);
  }

  return gradePicker;
}

function mountCaptureUi(root: HTMLElement): void {
  const panel = document.createElement("div");
  panel.className = "solvecue-panel";

  const captureButton = document.createElement("button");
  captureButton.type = "button";
  captureButton.className = "solvecue-button";
  captureButton.textContent = "I solved it";

  const status = document.createElement("div");
  status.className = "solvecue-status";
  status.hidden = true;

  const gradePicker = createGradePicker(
    "How hard was it for you?",
    async (grade) => {
      const slug = currentSlug();
      if (!slug) {
        status.hidden = false;
        status.textContent = "Could not detect the current problem.";
        return;
      }

      captureButton.disabled = true;
      try {
        const leetcodeTag = parseLeetCodeTag(document);
        if (!leetcodeTag) {
          console.warn("[SolveCue] Could not parse LeetCode difficulty tag");
        }

        const problem = await captureProblem(
          storage,
          {
            id: slug,
            title: parseProblemTitle(document, slug),
            url: window.location.href,
            leetcodeTag: leetcodeTag ?? "Medium",
          },
          grade,
          () => new Date(),
          Math.random,
        );

        gradePicker.classList.remove("open");
        status.hidden = false;
        status.textContent = `Captured. Next review: ${problem.softDueDate ?? "soon"}`;
      } finally {
        captureButton.disabled = false;
      }
    },
  );

  captureButton.addEventListener("click", () => {
    gradePicker.classList.toggle("open");
  });

  panel.append(captureButton, gradePicker, status);
  root.appendChild(panel);
}

function mountReviewUi(slug: string, root: HTMLElement): void {
  const panel = document.createElement("div");
  panel.className = "solvecue-panel";

  const reviewButton = document.createElement("button");
  reviewButton.type = "button";
  reviewButton.className = "solvecue-button";
  reviewButton.textContent = "I saw that / reviewed";

  const status = document.createElement("div");
  status.className = "solvecue-status";
  status.textContent = "Cold review — editor reset requested";

  const gradePicker = createGradePicker(
    "Re-grade this review:",
    async (grade) => {
      const activeSlug = currentSlug() ?? slug;
      reviewButton.disabled = true;
      try {
        const problem = await completeReview(
          storage,
          activeSlug,
          grade,
          () => new Date(),
          Math.random,
        );

        gradePicker.classList.remove("open");
        status.hidden = false;
        status.textContent = `Reviewed. Next review: ${problem.softDueDate ?? "soon"}`;
        reviewButton.disabled = true;
        reviewButton.textContent = "Review complete";
      } catch (error) {
        console.error("[SolveCue] Failed to complete review", error);
        status.hidden = false;
        status.textContent = "Could not complete review.";
        reviewButton.disabled = false;
      }
    },
  );

  reviewButton.addEventListener("click", () => {
    gradePicker.classList.toggle("open");
  });

  panel.append(reviewButton, gradePicker, status);
  root.appendChild(panel);

  void resetToDefaultCode(document).then((reset) => {
    if (!reset) {
      status.textContent =
        "Cold review — could not find Reset to Default. Clear the editor manually.";
      return;
    }

    status.textContent = "Cold review — editor cleared";
  });
}

function unmountUi(): void {
  document.getElementById("solvecue-root")?.remove();
  mountedSlug = null;
}

async function mountUi(): Promise<void> {
  const slug = currentSlug();
  if (!slug) {
    unmountUi();
    return;
  }

  if (mountedSlug === slug && document.getElementById("solvecue-root")) {
    return;
  }

  unmountUi();

  const root = document.createElement("div");
  root.id = "solvecue-root";
  document.body.appendChild(root);
  mountedSlug = slug;

  const reviewing = await storage.isPendingReview(slug);
  if (reviewing) {
    mountReviewUi(slug, root);
    console.info("[SolveCue] Review UI mounted for", slug);
    return;
  }

  mountCaptureUi(root);
  console.info("[SolveCue] Capture UI mounted for", slug);
}

function watchSpaNavigation(): void {
  let lastPathname = window.location.pathname;

  const syncIfPathChanged = () => {
    if (window.location.pathname === lastPathname) {
      return;
    }
    lastPathname = window.location.pathname;
    void mountUi();
  };

  // popstate covers back/forward; polling covers LeetCode's SPA pushState
  // (page-world history calls are invisible to the isolated content script).
  window.addEventListener("popstate", syncIfPathChanged);
  window.setInterval(syncIfPathChanged, 500);
}

const marker = document.createElement("meta");
marker.name = "solvecue-content-script";
marker.content = "active";
document.head.appendChild(marker);

watchSpaNavigation();
mountReviewPanel();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void mountUi();
  });
} else {
  void mountUi();
}
