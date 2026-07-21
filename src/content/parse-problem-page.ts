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

export function parseLeetCodeTag(document: Document): LeetCodeTag {
  const difficultyElement = document.querySelector(
    '[class*="text-difficulty-Easy"], [class*="text-difficulty-Medium"], [class*="text-difficulty-Hard"], [diff]',
  );

  const className = difficultyElement?.className ?? "";
  if (className.includes("Easy")) {
    return "Easy";
  }
  if (className.includes("Hard")) {
    return "Hard";
  }
  if (className.includes("Medium")) {
    return "Medium";
  }

  const text = difficultyElement?.textContent?.trim();
  if (text === "Easy" || text === "Medium" || text === "Hard") {
    return text;
  }

  return "Medium";
}
