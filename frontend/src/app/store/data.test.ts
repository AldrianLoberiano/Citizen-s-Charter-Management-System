import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setDepartments,
  setCharters,
  setRatings,
  setFeedback,
  getDepartments,
  getDepartmentById,
  getCharters,
  getCharterById,
  getChartersByDepartment,
  getRatings,
  getRatingsByCharter,
  getFeedback,
  getFeedbackByCharter,
  getCombinedFeedback,
  getCombinedFeedbackByCharter,
  getAverageRating,
  formatDate,
  formatDateTime,
  isAuthenticated,
  logout,
  getAuthUser,
} from "./data";

vi.mock("../lib/api", () => ({
  api: {
    createDepartment: vi.fn(),
    updateDepartment: vi.fn(),
    deleteDepartment: vi.fn(),
    createCharter: vi.fn(),
    updateCharter: vi.fn(),
    deleteCharter: vi.fn(),
    addFeedback: vi.fn(),
    login: vi.fn(),
  },
}));

const mockDepartments = [
  { id: 1, name: "Dept A", description: "Desc A" },
  { id: 2, name: "Dept B", description: "Desc B" },
];

const mockCharters = [
  { id: 1, department_id: 1, title: "Charter 1", content: "Content 1", created_at: "2026-01-01" },
  { id: 2, department_id: 2, title: "Charter 2", content: "Content 2", created_at: "2026-01-02" },
  { id: 3, department_id: 1, title: "Charter 3", content: "Content 3", created_at: "2026-01-03" },
];

const mockRatings = [
  { id: 1, charter_id: 1, rating: 5, comment: "Great", created_at: "2026-01-01" },
  { id: 2, charter_id: 1, rating: 4, comment: "Good", created_at: "2026-01-02" },
];

const mockFeedback = [
  { id: 1, charter_id: 1, name: "John", email: "john@test.com", contact: "123", rating: 3, comment: "OK", created_at: "2026-01-01" },
];

describe("data store", () => {
  beforeEach(() => {
    setDepartments(mockDepartments);
    setCharters(mockCharters);
    setRatings(mockRatings);
    setFeedback(mockFeedback);
  });

  describe("departments", () => {
    it("returns all departments", () => {
      expect(getDepartments()).toHaveLength(2);
    });

    it("returns a copy (not reference)", () => {
      const depts = getDepartments();
      depts.push({ id: 99, name: "X", description: "" });
      expect(getDepartments()).toHaveLength(2);
    });

    it("finds department by id", () => {
      expect(getDepartmentById(1)?.name).toBe("Dept A");
    });

    it("returns undefined for non-existent id", () => {
      expect(getDepartmentById(999)).toBeUndefined();
    });
  });

  describe("charters", () => {
    it("returns all charters", () => {
      expect(getCharters()).toHaveLength(3);
    });

    it("finds charter by id", () => {
      expect(getCharterById(2)?.title).toBe("Charter 2");
    });

    it("filters charters by department", () => {
      const dept1Charters = getChartersByDepartment(1);
      expect(dept1Charters).toHaveLength(2);
    });

    it("returns empty array for department with no charters", () => {
      expect(getChartersByDepartment(999)).toHaveLength(0);
    });
  });

  describe("ratings", () => {
    it("returns all ratings", () => {
      expect(getRatings()).toHaveLength(2);
    });

    it("filters ratings by charter", () => {
      expect(getRatingsByCharter(1)).toHaveLength(2);
    });

    it("returns empty for charter with no ratings", () => {
      expect(getRatingsByCharter(999)).toHaveLength(0);
    });
  });

  describe("feedback", () => {
    it("returns all feedback", () => {
      expect(getFeedback()).toHaveLength(1);
    });

    it("filters feedback by charter", () => {
      expect(getFeedbackByCharter(1)).toHaveLength(1);
    });
  });

  describe("combined feedback", () => {
    it("combines ratings and feedback", () => {
      const combined = getCombinedFeedback();
      expect(combined).toHaveLength(3);
    });

    it("filters combined feedback by charter", () => {
      const combined = getCombinedFeedbackByCharter(1);
      expect(combined).toHaveLength(3);
    });

    it("each entry has correct source", () => {
      const combined = getCombinedFeedback();
      const ratingEntries = combined.filter((e) => e.source === "rating");
      const feedbackEntries = combined.filter((e) => e.source === "feedback");
      expect(ratingEntries).toHaveLength(2);
      expect(feedbackEntries).toHaveLength(1);
    });
  });

  describe("getAverageRating", () => {
    it("calculates average correctly", () => {
      const avg = getAverageRating(1);
      expect(avg).toBe(4);
    });

    it("returns 0 for charter with no feedback", () => {
      expect(getAverageRating(999)).toBe(0);
    });
  });

  describe("formatDate", () => {
    it("formats a valid date string", () => {
      const result = formatDate("2026-01-15");
      expect(result).toContain("Jan");
      expect(result).toContain("2026");
    });

    it("returns empty for undefined", () => {
      expect(formatDate(undefined)).toBe("");
    });

    it("returns original for invalid date", () => {
      expect(formatDate("not-a-date")).toBe("not-a-date");
    });
  });

  describe("formatDateTime", () => {
    it("formats a valid datetime string", () => {
      const result = formatDateTime("2026-01-15T10:30:00");
      expect(result).toContain("Jan");
      expect(result).toContain("2026");
    });

    it("returns empty for undefined", () => {
      expect(formatDateTime(undefined)).toBe("");
    });
  });

  describe("auth helpers", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("isAuthenticated returns false when no user", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("isAuthenticated returns true when user is set", () => {
      localStorage.setItem("ccms_auth_user", JSON.stringify("admin"));
      expect(isAuthenticated()).toBe(true);
    });

    it("getAuthUser returns stored user", () => {
      localStorage.setItem("ccms_auth_user", JSON.stringify("admin"));
      expect(getAuthUser()).toBe("admin");
    });

    it("logout clears user", () => {
      localStorage.setItem("ccms_auth_user", JSON.stringify("admin"));
      logout();
      expect(isAuthenticated()).toBe(false);
    });
  });
});