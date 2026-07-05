import { api } from "../lib/api";
import {
  setDepartments,
  setCharters,
  setRatings,
  setFeedback,
} from "./data";

export async function syncLocalCacheFromApi(): Promise<void> {
  const results = await Promise.allSettled([
    api.getDepartments(),
    api.getCharters(),
    api.getRatingsAll(),
    api.getFeedback(),
  ]);

  if (results[0].status === "fulfilled") setDepartments(results[0].value);
  if (results[1].status === "fulfilled") setCharters(results[1].value);
  if (results[2].status === "fulfilled") setRatings(results[2].value);
  if (results[3].status === "fulfilled") setFeedback(results[3].value);
}
