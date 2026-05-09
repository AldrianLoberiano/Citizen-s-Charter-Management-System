import { api } from "../lib/api";
import {
  getDepartments,
  getCharters,
  getFeedback,
  setDepartments,
  setCharters,
  setFeedback,
} from "./data";

export async function syncLocalCacheFromApi(): Promise<void> {
  try {
    const [departments, charters] = await Promise.all([
      api.getDepartments(),
      api.getCharters(),
    ]);

    setDepartments(departments);
    setCharters(charters);

    const feedback = await api.getFeedback();
    setFeedback(feedback);
  } catch {
    setDepartments(getDepartments());
    setCharters(getCharters());
    setFeedback(getFeedback());
  }
}
