import { captureProblem } from "../capture/capture-problem";
import { createChromeStorageAdapter } from "../storage/storage-adapter";
import type { Grade } from "../types/domain";
import "./content-script.css";
import {
  parseLeetCodeTag,
  parseProblemSlug,
  parseProblemTitle,
} from "./parse-problem-page";

const GRADE_OPTIONS: Array<{ grade: Grade; label: string }> = [
  { grade: "couldnt-solve", label: "Couldn't solve" },
  { grade: "struggled", label: "Struggled" },
  { grade: "solid", label: "Solid" },
  { grade: "easy", label: "Easy" },
];

const storage = createChromeStorageAdapter(chrome.storage.local);

function mountCaptureUi(): void {
  const slug = parseProblemSlug(window.location.pathname);
  if (!slug || document.getElementById("solvecue-root")) {
    return;
  }

  const root = document.createElement("div");
  root.id = "solvecue-root";

  const panel = document.createElement("div");
  panel.className = "solvecue-panel";

  const captureButton = document.createElement("button");
  captureButton.type = "button";
  captureButton.className = "solvecue-button";
  captureButton.textContent = "I solved it";

  const gradePicker = document.createElement("div");
  gradePicker.className = "solvecue-grade-picker";

  const prompt = document.createElement("p");
  prompt.textContent = "How hard was it for you?";
  gradePicker.appendChild(prompt);

  const status = document.createElement("div");
  status.className = "solvecue-status";
  status.hidden = true;

  for (const option of GRADE_OPTIONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "solvecue-grade-button";
    button.textContent = option.label;
    button.addEventListener("click", async () => {
      captureButton.disabled = true;
      try {
        const problem = await captureProblem(
          storage,
          {
            id: slug,
            title: parseProblemTitle(document, slug),
            url: window.location.href,
            leetcodeTag: parseLeetCodeTag(document),
          },
          option.grade,
          () => new Date(),
          Math.random,
        );

        gradePicker.classList.remove("open");
        status.hidden = false;
        status.textContent = `Captured. Next review: ${problem.softDueDate ?? "soon"}`;
      } finally {
        captureButton.disabled = false;
      }
    });
    gradePicker.appendChild(button);
  }

  captureButton.addEventListener("click", () => {
    gradePicker.classList.toggle("open");
  });

  panel.append(captureButton, gradePicker, status);
  root.appendChild(panel);
  document.body.appendChild(root);

  console.info("[SolveCue] Capture UI mounted for", slug);
}

const marker = document.createElement("meta");
marker.name = "solvecue-content-script";
marker.content = "active";
document.head.appendChild(marker);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountCaptureUi);
} else {
  mountCaptureUi();
}
