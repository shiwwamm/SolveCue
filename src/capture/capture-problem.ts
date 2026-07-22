import { review } from "../scheduler/review";
import {
  buildCalendarLoad,
  placeReview,
  type Clock,
  type Rng,
} from "../scheduler/scheduler";
import type { Grade, LeetCodeTag, Problem } from "../types/domain";
import type { StorageAdapter } from "../storage/storage-adapter";
import { INITIAL_EASE } from "../scheduler/review";

export interface CaptureInput {
  id: string;
  title: string;
  url: string;
  leetcodeTag: LeetCodeTag;
}

export async function captureProblem(
  storage: StorageAdapter,
  input: CaptureInput,
  grade: Grade,
  now: Clock,
  rng: Rng,
): Promise<Problem> {
  const existing = await storage.getProblem(input.id);
  const base: Problem =
    existing ??
    ({
      id: input.id,
      title: input.title,
      url: input.url,
      leetcodeTag: input.leetcodeTag,
      addedAt: now().toISOString(),
      lastReviewedAt: null,
      reviewHistory: [],
      easeFactor: INITIAL_EASE,
      currentInterval: 0,
      repetitions: 0,
      softDueDate: null,
      hardDueDate: null,
      status: "active",
    } satisfies Problem);

  const problem: Problem = {
    ...base,
    title: input.title,
    url: input.url,
    leetcodeTag: input.leetcodeTag,
  };

  const reviewed = review(problem, grade, now, rng);
  const settings = await storage.getSettings();
  const others = (await storage.listProblems()).filter(
    (entry) => entry.id !== reviewed.id,
  );
  const placed = placeReview(
    reviewed,
    buildCalendarLoad(others),
    settings.dailyTargetCap,
    now,
    rng,
  );

  await storage.saveProblem(placed);
  return placed;
}
