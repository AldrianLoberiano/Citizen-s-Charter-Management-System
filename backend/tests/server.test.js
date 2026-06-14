import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4099;
let serverProcess;

function startServer() {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, PORT: String(PORT), NODE_ENV: "test" };
    serverProcess = spawn("node", ["server.js"], {
      cwd: path.resolve(__dirname, ".."),
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let started = false;
    serverProcess.stdout.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("listening") && !started) {
        started = true;
        resolve();
      }
    });

    serverProcess.stderr.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("listening") && !started) {
        started = true;
        resolve();
      }
    });

    serverProcess.on("error", reject);
    serverProcess.on("exit", (code) => {
      if (!started) reject(new Error(`Server exited with code ${code}`));
    });

    setTimeout(() => {
      if (!started) {
        started = true;
        resolve();
      }
    }, 5000);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

const BASE = `http://localhost:${PORT}`;

beforeAll(async () => {
  try {
    await startServer();
  } catch (e) {
    console.error("Failed to start server:", e.message);
  }
}, 15000);

afterAll(() => {
  stopServer();
});

describe("Health", () => {
  it("GET /api/health returns ok", async () => {
    const res = await request(BASE).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe("Departments CRUD", () => {
  let createdId;

  it("POST /api/departments creates a department", async () => {
    const res = await request(BASE)
      .post("/api/departments")
      .send({ name: "Test Department", description: "Test" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test Department");
    createdId = res.body.id;
  });

  it("GET /api/departments returns array", async () => {
    const res = await request(BASE).get("/api/departments");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/departments/:id returns the department", async () => {
    const res = await request(BASE).get(`/api/departments/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdId);
  });

  it("PUT /api/departments/:id updates", async () => {
    const res = await request(BASE)
      .put(`/api/departments/${createdId}`)
      .send({ name: "Updated Dept", description: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Dept");
  });

  it("POST /api/departments without name returns 400", async () => {
    const res = await request(BASE)
      .post("/api/departments")
      .send({ name: "" });
    expect(res.status).toBe(400);
  });

  it("DELETE /api/departments/:id removes", async () => {
    const res = await request(BASE).delete(`/api/departments/${createdId}`);
    expect(res.status).toBe(204);
  });

  it("GET /api/departments/:id after delete returns 404", async () => {
    const res = await request(BASE).get(`/api/departments/${createdId}`);
    expect(res.status).toBe(404);
  });
});

describe("Charters CRUD", () => {
  let deptId;
  let charterId;

  beforeAll(async () => {
    const deptRes = await request(BASE)
      .post("/api/departments")
      .send({ name: "Charter Test Dept", description: "" });
    deptId = deptRes.body.id;
  });

  afterAll(async () => {
    if (charterId) await request(BASE).delete(`/api/charters/${charterId}`);
    if (deptId) await request(BASE).delete(`/api/departments/${deptId}`);
  });

  it("POST /api/charters creates a charter", async () => {
    const res = await request(BASE)
      .post("/api/charters")
      .send({
        department_id: deptId,
        title: "Test Charter",
        content: "Test content",
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Test Charter");
    charterId = res.body.id;
  });

  it("GET /api/charters returns array", async () => {
    const res = await request(BASE).get("/api/charters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/charters?departmentId=X filters", async () => {
    const res = await request(BASE).get(`/api/charters?departmentId=${deptId}`);
    expect(res.status).toBe(200);
    res.body.forEach((c) => expect(c.department_id).toBe(deptId));
  });

  it("GET /api/charters/:id returns the charter", async () => {
    const res = await request(BASE).get(`/api/charters/${charterId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(charterId);
  });

  it("PUT /api/charters/:id updates", async () => {
    const res = await request(BASE)
      .put(`/api/charters/${charterId}`)
      .send({
        department_id: deptId,
        title: "Updated Charter",
        content: "Updated",
      });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Charter");
  });

  it("POST /api/charters without required fields returns 400", async () => {
    const res = await request(BASE)
      .post("/api/charters")
      .send({ department_id: deptId });
    expect(res.status).toBe(400);
  });
});

describe("Ratings", () => {
  let deptId;
  let charterId;

  beforeAll(async () => {
    const deptRes = await request(BASE)
      .post("/api/departments")
      .send({ name: "Rating Test Dept", description: "" });
    deptId = deptRes.body.id;
    const charterRes = await request(BASE)
      .post("/api/charters")
      .send({
        department_id: deptId,
        title: "Rating Charter",
        content: "Content",
      });
    charterId = charterRes.body.id;
  });

  afterAll(async () => {
    if (charterId) await request(BASE).delete(`/api/charters/${charterId}`);
    if (deptId) await request(BASE).delete(`/api/departments/${deptId}`);
  });

  it("POST /api/charters/:id/ratings creates a rating", async () => {
    const res = await request(BASE)
      .post(`/api/charters/${charterId}/ratings`)
      .send({ rating: 5, comment: "Excellent" });
    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(5);
  });

  it("GET /api/charters/:id/ratings returns ratings", async () => {
    const res = await request(BASE).get(`/api/charters/${charterId}/ratings`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/ratings returns all ratings", async () => {
    const res = await request(BASE).get("/api/ratings");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST rating with invalid value returns 400", async () => {
    const res = await request(BASE)
      .post(`/api/charters/${charterId}/ratings`)
      .send({ rating: 10 });
    expect(res.status).toBe(400);
  });
});

describe("Feedback", () => {
  let deptId;
  let charterId;

  beforeAll(async () => {
    const deptRes = await request(BASE)
      .post("/api/departments")
      .send({ name: "Feedback Test Dept", description: "" });
    deptId = deptRes.body.id;
    const charterRes = await request(BASE)
      .post("/api/charters")
      .send({
        department_id: deptId,
        title: "Feedback Charter",
        content: "Content",
      });
    charterId = charterRes.body.id;
  });

  afterAll(async () => {
    if (charterId) await request(BASE).delete(`/api/charters/${charterId}`);
    if (deptId) await request(BASE).delete(`/api/departments/${deptId}`);
  });

  it("POST /api/charters/:id/feedback creates feedback", async () => {
    const res = await request(BASE)
      .post(`/api/charters/${charterId}/feedback`)
      .send({
        name: "Test User",
        email: "test@test.com",
        contact: "123",
        rating: 4,
        comment: "Good",
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test User");
    expect(res.body.rating).toBe(4);
  });

  it("GET /api/charters/:id/feedback returns feedback", async () => {
    const res = await request(BASE).get(`/api/charters/${charterId}/feedback`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/feedback returns all feedback", async () => {
    const res = await request(BASE).get("/api/feedback");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST feedback with invalid rating returns 400", async () => {
    const res = await request(BASE)
      .post(`/api/charters/${charterId}/feedback`)
      .send({ rating: 0 });
    expect(res.status).toBe(400);
  });
});

describe("Auth", () => {
  it("POST /api/auth/login with missing fields returns 400", async () => {
    const res = await request(BASE)
      .post("/api/auth/login")
      .send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/auth/login with wrong credentials returns 401", async () => {
    const res = await request(BASE)
      .post("/api/auth/login")
      .send({ username: "wrong", password: "wrong" });
    expect(res.status).toBe(401);
  });
});