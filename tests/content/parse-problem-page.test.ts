import { describe, expect, it } from "vitest";
import {
  parseLeetCodeTag,
  parseProblemSlug,
  parseProblemTitle,
} from "../../src/content/parse-problem-page";

function createDifficultyElement(tag: "Easy" | "Medium" | "Hard") {
  return {
    textContent: tag,
    className: `text-difficulty-${tag.toLowerCase()}`,
  };
}

function createAncestorChain(
  titleElement: object,
  ancestors: Array<{ querySelector: (selector: string) => Element | null }>,
) {
  let current = titleElement as {
    parentElement: typeof current | null;
    querySelector?: (selector: string) => Element | null;
  };

  for (const ancestor of ancestors) {
    current.parentElement = ancestor as typeof current;
    current = ancestor as typeof current;
  }

  current.parentElement = null;
}

describe("parseProblemSlug", () => {
  it("extracts the slug from a problem URL", () => {
    expect(parseProblemSlug("/problems/two-sum/description/")).toBe("two-sum");
  });
});

describe("parseProblemTitle", () => {
  it("reads the title from the page when present", () => {
    const document = {
      querySelector: () => ({ textContent: "1. Two Sum" }),
    } as unknown as Document;

    expect(parseProblemTitle(document, "two-sum")).toBe("1. Two Sum");
  });
});

describe("parseLeetCodeTag", () => {
  it("reads Easy from LeetCode's lowercase difficulty class", () => {
    const titleElement = { textContent: "1. Two Sum" };
    createAncestorChain(titleElement, [
      { querySelector: () => null },
      {
        querySelector: (selector: string) =>
          selector.includes("text-difficulty-")
            ? (createDifficultyElement("Easy") as unknown as Element)
            : null,
      },
    ]);

    const document = {
      querySelector: (selector: string) =>
        selector.includes("text-title-large") ? titleElement : null,
    } as unknown as Document;

    expect(parseLeetCodeTag(document)).toBe("Easy");
  });

  it("finds the badge in a sibling container under a shared ancestor", () => {
    const titleElement = { textContent: "1. Two Sum" };
    createAncestorChain(titleElement, [
      { querySelector: () => null },
      { querySelector: () => null },
      {
        querySelector: (selector: string) =>
          selector.includes("text-difficulty-")
            ? (createDifficultyElement("Easy") as unknown as Element)
            : null,
      },
    ]);

    const document = {
      querySelector: (selector: string) =>
        selector.includes("text-title-large") ? titleElement : null,
    } as unknown as Document;

    expect(parseLeetCodeTag(document)).toBe("Easy");
  });

  it("reads Medium and Hard from difficulty classes", () => {
    expect(
      parseLeetCodeTag({
        querySelector: (selector: string) =>
          selector.includes("text-difficulty-")
            ? (createDifficultyElement("Medium") as unknown as Element)
            : null,
      } as unknown as Document),
    ).toBe("Medium");

    expect(
      parseLeetCodeTag({
        querySelector: (selector: string) =>
          selector.includes("text-difficulty-")
            ? (createDifficultyElement("Hard") as unknown as Element)
            : null,
      } as unknown as Document),
    ).toBe("Hard");
  });
});
