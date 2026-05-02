import { api } from "../lib/api";
import {
  getDepartments,
  getCharters,
  getRatings,
  setDepartments,
  setCharters,
  setRatings,
} from "./data";

export async function syncLocalCacheFromApi(): Promise<void> {
  try {
    const [departments, charters] = await Promise.all([
      api.getDepartments(),
      api.getCharters(),
    ]);

    setDepartments(departments);
    setCharters(charters);

    const ratingsByCharter = await Promise.all(
      charters.map(async (charter: { id: number }) => ({
        charterId: charter.id,
        ratings: await api.getRatings(charter.id),
      }))
    );

    setRatings(ratingsByCharter.flatMap((item) => item.ratings));
  } catch {
    setDepartments(getDepartments());
    setCharters(getCharters());
    setRatings(getRatings());
  }
}
