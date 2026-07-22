import type { Problem } from "../types/domain";
import type { StorageAdapter } from "../storage/storage-adapter";

export async function pauseProblem(
  storage: StorageAdapter,
  problemId: string,
): Promise<Problem> {
  const existing = await storage.getProblem(problemId);
  if (!existing) {
    throw new Error(`Cannot pause unknown problem: ${problemId}`);
  }

  const paused: Problem = { ...existing, status: "paused" };
  await storage.saveProblem(paused);
  return paused;
}

export async function reactivateProblem(
  storage: StorageAdapter,
  problemId: string,
): Promise<Problem> {
  const existing = await storage.getProblem(problemId);
  if (!existing) {
    throw new Error(`Cannot reactivate unknown problem: ${problemId}`);
  }

  const reactivated: Problem = { ...existing, status: "active" };
  await storage.saveProblem(reactivated);
  return reactivated;
}
