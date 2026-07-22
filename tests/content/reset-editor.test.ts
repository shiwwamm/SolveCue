import { describe, expect, it } from "vitest";
import {
  findConfirmResetButton,
  findResetButton,
} from "../../src/content/reset-editor";

type FakeElement = {
  tagName?: string;
  textContent?: string | null;
  getAttribute: (name: string) => string | null;
  querySelectorAll?: (selector: string) => FakeElement[];
};

function button(label: string, text = label): FakeElement {
  return {
    tagName: "BUTTON",
    textContent: text,
    getAttribute(name) {
      if (name === "aria-label") {
        return label;
      }
      return null;
    },
  };
}

function createDocument(elements: FakeElement[]): Document {
  return {
    querySelectorAll(selector: string) {
      if (selector.includes("role=\"dialog\"")) {
        return [] as unknown as NodeListOf<Element>;
      }

      return elements as unknown as NodeListOf<Element>;
    },
  } as Document;
}

describe("findResetButton", () => {
  it("finds the LeetCode reset control by aria-label", () => {
    const reset = button("Reset to default code definition", "↻");
    const document = createDocument([button("Run"), reset]);

    expect(findResetButton(document)).toBe(reset);
  });

  it("returns null when the reset control is absent", () => {
    const document = createDocument([button("Run")]);

    expect(findResetButton(document)).toBeNull();
  });
});

describe("findConfirmResetButton", () => {
  it("finds the confirm action inside a dialog", () => {
    const confirm = button("Confirm");
    const dialog = {
      getAttribute: () => null,
      querySelectorAll() {
        return [button("Cancel"), confirm];
      },
    };
    const document = {
      querySelectorAll(selector: string) {
        if (selector.includes("role=\"dialog\"")) {
          return [dialog] as unknown as NodeListOf<Element>;
        }
        return [] as unknown as NodeListOf<Element>;
      },
    } as Document;

    expect(findConfirmResetButton(document)).toBe(confirm);
  });

  it("accepts a Reset label on the confirm button", () => {
    const reset = button("Reset");
    const dialog = {
      getAttribute: () => null,
      querySelectorAll() {
        return [button("Cancel"), reset];
      },
    };
    const document = {
      querySelectorAll(selector: string) {
        if (selector.includes("role=\"dialog\"")) {
          return [dialog] as unknown as NodeListOf<Element>;
        }
        return [] as unknown as NodeListOf<Element>;
      },
    } as Document;

    expect(findConfirmResetButton(document)).toBe(reset);
  });
});
