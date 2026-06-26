import { describe, it, expect } from "vitest";

const API_BASE = "http://localhost:4000/api";

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

describe("API Client", () => {
  describe("request helper", () => {
    it("throws on non-ok response", async () => {
      await expect(request("/nonexistent")).rejects.toThrow();
    });
  });

  describe("health endpoint", () => {
    it("returns ok: true", async () => {
      const data = await request("/health");
      expect(data.ok).toBe(true);
    });
  });

  describe("departments endpoints", () => {
    let createdId: number;

    it("GET /departments returns array", async () => {
      const data = await request("/departments");
      expect(Array.isArray(data)).toBe(true);
    });

    it("POST /departments creates a department", async () => {
      const data = await request("/departments", {
        method: "POST",
        body: JSON.stringify({ name: "Test Department", description: "Test Desc" }),
      });
      expect(data.name).toBe("Test Department");
      createdId = data.id;
    });

    it("GET /departments/:id returns the department", async () => {
      const data = await request(`/departments/${createdId}`);
      expect(data.id).toBe(createdId);
      expect(data.name).toBe("Test Department");
    });

    it("PUT /departments/:id updates the department", async () => {
      const data = await request(`/departments/${createdId}`, {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Dept", description: "Updated" }),
      });
      expect(data.name).toBe("Updated Dept");
    });

    it("DELETE /departments/:id removes the department", async () => {
      const response = await fetch(`${API_BASE}/departments/${createdId}`, {
        method: "DELETE",
      });
      expect(response.status).toBe(204);
    });

    it("POST /departments without name returns 400", async () => {
      await expect(
        request("/departments", {
          method: "POST",
          body: JSON.stringify({ name: "" }),
        })
      ).rejects.toThrow();
    });
  });

  describe("charters endpoints", () => {
    let deptId: number;
    let charterId: number;

    it("creates a department for charters", async () => {
      const data = await request("/departments", {
        method: "POST",
        body: JSON.stringify({ name: "Charter Test Dept", description: "" }),
      });
      deptId = data.id;
    });

    it("POST /charters creates a charter", async () => {
      const data = await request("/charters", {
        method: "POST",
        body: JSON.stringify({
          department_id: deptId,
          title: "Test Charter",
          content: "Test Content",
        }),
      });
      expect(data.title).toBe("Test Charter");
      charterId = data.id;
    });

    it("GET /charters returns array", async () => {
      const data = await request("/charters");
      expect(Array.isArray(data)).toBe(true);
    });

    it("GET /charters?departmentId=X filters by department", async () => {
      const data = await request(`/charters?departmentId=${deptId}`);
      expect(Array.isArray(data)).toBe(true);
      data.forEach((c: any) => expect(c.department_id).toBe(deptId));
    });

    it("GET /charters/:id returns the charter", async () => {
      const data = await request(`/charters/${charterId}`);
      expect(data.id).toBe(charterId);
    });

    it("PUT /charters/:id updates the charter", async () => {
      const data = await request(`/charters/${charterId}`, {
        method: "PUT",
        body: JSON.stringify({
          department_id: deptId,
          title: "Updated Charter",
          content: "Updated Content",
        }),
      });
      expect(data.title).toBe("Updated Charter");
    });

    it("DELETE /charters/:id removes the charter", async () => {
      const response = await fetch(`${API_BASE}/charters/${charterId}`, {
        method: "DELETE",
      });
      expect(response.status).toBe(204);
    });

    it("cleanup test department", async () => {
      const response = await fetch(`${API_BASE}/departments/${deptId}`, {
        method: "DELETE",
      });
      expect(response.status).toBe(204);
    });
  });

  describe("ratings endpoints", () => {
    let deptId: number;
    let charterId: number;

    it("creates test data", async () => {
      const dept = await request("/departments", {
        method: "POST",
        body: JSON.stringify({ name: "Rating Test Dept", description: "" }),
      });
      deptId = dept.id;
      const charter = await request("/charters", {
        method: "POST",
        body: JSON.stringify({
          department_id: deptId,
          title: "Rating Charter",
          content: "Content",
        }),
      });
      charterId = charter.id;
    });

    it("POST /charters/:id/ratings creates a rating", async () => {
      const data = await request(`/charters/${charterId}/ratings`, {
        method: "POST",
        body: JSON.stringify({ rating: 5, comment: "Excellent" }),
      });
      expect(data.rating).toBe(5);
    });

    it("GET /charters/:id/ratings returns ratings", async () => {
      const data = await request(`/charters/${charterId}/ratings`);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it("POST rating with invalid value returns 400", async () => {
      await expect(
        request(`/charters/${charterId}/ratings`, {
          method: "POST",
          body: JSON.stringify({ rating: 10 }),
        })
      ).rejects.toThrow();
    });

    it("cleanup", async () => {
      await fetch(`${API_BASE}/charters/${charterId}`, { method: "DELETE" });
      await fetch(`${API_BASE}/departments/${deptId}`, { method: "DELETE" });
    });
  });

  describe("feedback endpoints", () => {
    let deptId: number;
    let charterId: number;

    it("creates test data", async () => {
      const dept = await request("/departments", {
        method: "POST",
        body: JSON.stringify({ name: "Feedback Test Dept", description: "" }),
      });
      deptId = dept.id;
      const charter = await request("/charters", {
        method: "POST",
        body: JSON.stringify({
          department_id: deptId,
          title: "Feedback Charter",
          content: "Content",
        }),
      });
      charterId = charter.id;
    });

    it("POST /charters/:id/feedback creates feedback", async () => {
      const data = await request(`/charters/${charterId}/feedback`, {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "test@test.com",
          contact: "123456",
          rating: 4,
          comment: "Very good",
        }),
      });
      expect(data.name).toBe("Test User");
      expect(data.rating).toBe(4);
    });

    it("GET /charters/:id/feedback returns feedback", async () => {
      const data = await request(`/charters/${charterId}/feedback`);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it("GET /feedback returns all feedback", async () => {
      const data = await request("/feedback");
      expect(Array.isArray(data)).toBe(true);
    });

    it("POST feedback with invalid rating returns 400", async () => {
      await expect(
        request(`/charters/${charterId}/feedback`, {
          method: "POST",
          body: JSON.stringify({ rating: 0 }),
        })
      ).rejects.toThrow();
    });

    it("cleanup", async () => {
      await fetch(`${API_BASE}/charters/${charterId}`, { method: "DELETE" });
      await fetch(`${API_BASE}/departments/${deptId}`, { method: "DELETE" });
    });
  });

  describe("auth endpoints", () => {
    it("POST /auth/login with missing fields returns 400", async () => {
      await expect(
        request("/auth/login", {
          method: "POST",
          body: JSON.stringify({}),
        })
      ).rejects.toThrow();
    });

    it("POST /auth/login with wrong credentials returns 401", async () => {
      await expect(
        request("/auth/login", {
          method: "POST",
          body: JSON.stringify({ username: "wrong", password: "wrong" }),
        })
      ).rejects.toThrow();
    });
  });
});