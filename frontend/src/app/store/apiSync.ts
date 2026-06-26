import { api } from "../lib/api";
import {
  getDepartments,
  getCharters,
  getRatings,
  getFeedback,
  setDepartments,
  setCharters,
  setRatings,
  setFeedback,
} from "./data";

let pollTimer: ReturnType<typeof setInterval> | null = null;

export async function syncLocalCacheFromApi(): Promise<void> {
  const [departments, charters] = await Promise.all([
    api.getDepartments(),
    api.getCharters(),
  ]);

  setDepartments(departments);
  setCharters(charters);

  const [ratings, feedback] = await Promise.all([
    api.getRatingsAll(),
    api.getFeedback(),
  ]);
  setRatings(ratings);
  setFeedback(feedback);
}

export function startPolling(intervalMs = 5000) {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    syncLocalCacheFromApi().catch(() => {});
  }, intervalMs);
}

export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
