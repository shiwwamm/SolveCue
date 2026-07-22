import { describe, expect, it } from "vitest";
import { isReviewPanelDismissed } from "../src/review-panel-dismiss";
import type { ReviewPanelDismissState } from "../src/types/domain";

describe("isReviewPanelDismissed", () => {
  it("is not dismissed when there is no dismiss state", () => {
    expect(isReviewPanelDismissed(null, ["two-sum"], "2026-07-21")).toBe(false);
  });

  it("stays dismissed on the same scheduling day with the same queue", () => {
    const dismissState: ReviewPanelDismissState = {
      schedulingDay: "2026-07-21",
      queueIds: ["add-two-numbers", "two-sum"],
    };

    expect(
      isReviewPanelDismissed(
        dismissState,
        ["two-sum", "add-two-numbers"],
        "2026-07-21",
      ),
    ).toBe(true);
  });

  it("clears dismiss when the scheduling day rolls over", () => {
    const dismissState: ReviewPanelDismissState = {
      schedulingDay: "2026-07-21",
      queueIds: ["two-sum"],
    };

    expect(isReviewPanelDismissed(dismissState, ["two-sum"], "2026-07-22")).toBe(
      false,
    );
  });

  it("clears dismiss when the due queue changes", () => {
    const dismissState: ReviewPanelDismissState = {
      schedulingDay: "2026-07-21",
      queueIds: ["two-sum", "add-two-numbers"],
    };

    expect(
      isReviewPanelDismissed(dismissState, ["two-sum"], "2026-07-21"),
    ).toBe(false);
  });
});
