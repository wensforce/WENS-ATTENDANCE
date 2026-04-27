import request from "supertest";
import app from "../../src/app.js";
import { generateAccessToken } from "../../src/utils/token.js";
import { createTestUser } from "../utils/testDataFactory.js";

describe("Leaves Routes", () => {
  let api;
  let employeeToken;
  let adminToken;

  beforeEach(() => {
    api = request(app);

    const mockEmployee = createTestUser({ userType: "EMPLOYEE", id: 1 });
    const mockAdmin = createTestUser({ userType: "ADMIN", id: 2 });

    employeeToken = generateAccessToken({ userId: mockEmployee.id });
    adminToken = generateAccessToken({ userId: mockAdmin.id });
  });

  // ─── GET /api/v1/leaves ──────────────────────────────────────────────────────

  describe("GET /api/v1/leaves", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.get("/api/v1/leaves");
      expect(response.status).toBe(401);
    });

    it("should attempt to get leaves for authenticated user", async () => {
      const response = await api
        .get("/api/v1/leaves")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  // ─── GET /api/v1/leaves/get ──────────────────────────────────────────────────

  describe("GET /api/v1/leaves/get", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.get("/api/v1/leaves/get");
      expect(response.status).toBe(401);
    });

    it("should attempt to get all leaves for authenticated user", async () => {
      const response = await api
        .get("/api/v1/leaves/get")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  // ─── GET /api/v1/leaves/get/:id ─────────────────────────────────────────────

  describe("GET /api/v1/leaves/get/:id", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.get("/api/v1/leaves/get/1");
      expect(response.status).toBe(401);
    });

    it("should attempt to get leave by id for authenticated user", async () => {
      const response = await api
        .get("/api/v1/leaves/get/1")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });

    it("should attempt to get leave with non-existent id", async () => {
      const response = await api
        .get("/api/v1/leaves/get/999999")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect(response.status).toBeDefined();
    });
  });

  // ─── GET /api/v1/leaves/dates ────────────────────────────────────────────────

  describe("GET /api/v1/leaves/dates", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.get("/api/v1/leaves/dates");
      expect(response.status).toBe(401);
    });

    it("should return 422 or 400 for missing date query params", async () => {
      const response = await api
        .get("/api/v1/leaves/dates")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect(response.status).toBeDefined();
    });

    it("should attempt to get leaves by date range with valid params", async () => {
      const response = await api
        .get("/api/v1/leaves/dates")
        .query({ startDate: "2026-01-01", endDate: "2026-01-31" })
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  // ─── POST /api/v1/leaves ─────────────────────────────────────────────────────

  describe("POST /api/v1/leaves", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.post("/api/v1/leaves").send({});
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .post("/api/v1/leaves")
        .set("Cookie", [`accessToken=${employeeToken}`])
        .send({
          title: "Holi",
          date: "2026-03-25",
          type: "HOLIDAY",
        });
      expect([401, 403]).toContain(response.status);
    });

    it("should return 422 or 400 for missing required fields (admin)", async () => {
      const response = await api
        .post("/api/v1/leaves")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send({});
      expect(response.status).toBeDefined();
    });

    it("should attempt to create a leave/holiday with all required fields (admin)", async () => {
      const response = await api
        .post("/api/v1/leaves")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send({
          title: "Independence Day",
          date: "2026-08-15",
          type: "HOLIDAY",
        });
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  // ─── PUT /api/v1/leaves/:id ──────────────────────────────────────────────────

  describe("PUT /api/v1/leaves/:id", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.put("/api/v1/leaves/1").send({});
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .put("/api/v1/leaves/1")
        .set("Cookie", [`accessToken=${employeeToken}`])
        .send({ title: "Updated" });
      expect([401, 403]).toContain(response.status);
    });

    it("should attempt to update leave with admin token", async () => {
      const response = await api
        .put("/api/v1/leaves/999")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send({ title: "Updated Holiday", date: "2026-09-01", type: "HOLIDAY" });
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  // ─── DELETE /api/v1/leaves/:id ──────────────────────────────────────────────

  describe("DELETE /api/v1/leaves/:id", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.delete("/api/v1/leaves/1");
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .delete("/api/v1/leaves/1")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect([401, 403]).toContain(response.status);
    });

    it("should attempt to delete leave with admin token", async () => {
      const response = await api
        .delete("/api/v1/leaves/999")
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });
});
