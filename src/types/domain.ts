export type Grade = "couldnt-solve" | "struggled" | "solid" | "easy";

export type LeetCodeTag = "Easy" | "Medium" | "Hard";

export type ProblemStatus = "active" | "paused";

export interface ReviewEntry {
  date: string;
  grade: Grade;
}

export interface Problem {
  id: string;
  title: string;
  url: string;
  leetcodeTag: LeetCodeTag;
  addedAt: string;
  lastReviewedAt: string | null;
  reviewHistory: ReviewEntry[];
  easeFactor: number;
  currentInterval: number;
  repetitions: number;
  softDueDate: string | null;
  hardDueDate: string | null;
  status: ProblemStatus;
}

export interface ReviewPanelDismissState {
  schedulingDay: string;
  queueIds: string[];
}

export interface Settings {
  dailyTargetCap: number;
  dayRolloverHour: number;
  timezone: string;
}

export const DEFAULT_SETTINGS: Settings = {
  dailyTargetCap: 8,
  dayRolloverHour: 4,
  timezone: "local",
};
