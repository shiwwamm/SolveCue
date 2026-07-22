import { review } from "../scheduler/review";
import {
  buildCalendarLoad,
  placeReview,
  type Clock,
  type Rng,
} from "../scheduler/scheduler";
import type { Grade, Problem } from "../types/domain";
import type { StorageAdapter } from "../storage/storage-adapter";

export async function completeReview(
  storage: StorageAdapter,
  problemId: string,
  grade: Grade,
  now: Clock,
  rng: Rng,
): Promise<Problem> {
  const existing = await storage.getProblem(problemId);
  if (!existing) {
    throw new Error(`Cannot complete review for unknown problem: ${problemId}`);
  }

  const reviewed = review(existing, grade, now, rng);
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
  await storage.clearPendingReview(placed.id);
  return placed;
}
