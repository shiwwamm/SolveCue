import type { ReviewPanelDismissState } from "./types/domain";

function sameQueueIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();

  return sortedLeft.every((id, index) => id === sortedRight[index]);
}

export function isReviewPanelDismissed(
  dismissState: ReviewPanelDismissState | null,
  queueIds: string[],
  today: string,
): boolean {
  if (!dismissState) {
    return false;
  }

  if (today > dismissState.schedulingDay) {
    return false;
  }

  if (!sameQueueIds(queueIds, dismissState.queueIds)) {
    return false;
  }

  return true;
}
