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
