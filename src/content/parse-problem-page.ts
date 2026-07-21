import type { LeetCodeTag } from "../types/domain";

export function parseProblemSlug(pathname: string): string | null {
  const match = pathname.match(/\/problems\/([^/]+)/);
  return match?.[1] ?? null;
}

export function parseProblemTitle(document: Document, slug: string): string {
  const titleElement = document.querySelector(
    '[data-cy="question-title"], [class*="text-title-large"], h1[class*="title"]',
  );

  const title = titleElement?.textContent?.trim();
  if (title) {
    return title;
  }

  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function tagFromClassName(className: string): LeetCodeTag | null {
  const normalized = className.toLowerCase();

  if (normalized.includes("text-difficulty-easy")) {
    return "Easy";
  }
  if (normalized.includes("text-difficulty-hard")) {
    return "Hard";
  }
  if (normalized.includes("text-difficulty-medium")) {
    return "Medium";
  }

  return null;
}

function tagFromText(text: string): LeetCodeTag | null {
  if (text === "Easy" || text === "Medium" || text === "Hard") {
    return text;
  }

  return null;
}

function parseFromElement(element: Element): LeetCodeTag | null {
  const fromClass = tagFromClassName(element.className);
  if (fromClass) {
    return fromClass;
  }

  return tagFromText(element.textContent?.trim() ?? "");
}

export function parseLeetCodeTag(document: Document): LeetCodeTag | null {
  const titleElement = document.querySelector(
    '[data-cy="question-title"], [class*="text-title-large"], h1[class*="title"]',
  );

  if (titleElement) {
    let ancestor: Element | null = titleElement.parentElement;
    while (ancestor) {
      const difficultyElement = ancestor.querySelector(
        '[class*="text-difficulty-"]',
      );
      const parsed = difficultyElement
        ? parseFromElement(difficultyElement)
        : null;
      if (parsed) {
        return parsed;
      }
      ancestor = ancestor.parentElement;
    }
  }

  const fallback = document.querySelector('[class*="text-difficulty-"]');
  return fallback ? parseFromElement(fallback) : null;
}
