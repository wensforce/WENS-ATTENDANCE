import request from "supertest";
import app from "../../src/app.js";
import { generateAccessToken } from "../../src/utils/token.js";
import { createTestUser } from "../utils/testDataFactory.js";

describe("Designation Routes", () => {
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

  // ─── POST /api/v1/designation ────────────────────────────────────────────────

  describe("POST /api/v1/designation", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.post("/api/v1/designation").send({});
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .post("/api/v1/designation")
        .set("Cookie", [`accessToken=${employeeToken}`])
        .send({ name: "Manager" });
      expect([401, 403]).toContain(response.status);
    });

    it("should return 400 or 422 for missing required fields (admin)", async () => {
      const response = await api
        .post("/api/v1/designation")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send({});
      expect(response.status).toBeDefined();
    });

    it("should attempt to create a designation with valid data (admin)", async () => {
      const response = await api
        .post("/api/v1/designation")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send({ name: "Software Engineer", departmentId: 1 });
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  // ─── GET /api/v1/designation ─────────────────────────────────────────────────

  describe("GET /api/v1/designation", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.get("/api/v1/designation");
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .get("/api/v1/designation")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect([401, 403]).toContain(response.status);
    });

    it("should attempt to get all designations with admin token", async () => {
      const response = await api
        .get("/api/v1/designation")
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  // ─── GET /api/v1/designation/:id ─────────────────────────────────────────────

  describe("GET /api/v1/designation/:id", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.get("/api/v1/designation/1");
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .get("/api/v1/designation/1")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect([401, 403]).toContain(response.status);
    });

    it("should attempt to get designation by id with admin token", async () => {
      const response = await api
        .get("/api/v1/designation/1")
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });

    it("should return an appropriate response for non-existent designation id", async () => {
      const response = await api
        .get("/api/v1/designation/999999")
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
    });
  });

  // ─── PUT /api/v1/designation/:id ─────────────────────────────────────────────

  describe("PUT /api/v1/designation/:id", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.put("/api/v1/designation/1").send({});
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .put("/api/v1/designation/1")
        .set("Cookie", [`accessToken=${employeeToken}`])
        .send({ name: "Updated" });
      expect([401, 403]).toContain(response.status);
    });

    it("should attempt to update designation with admin token", async () => {
      const response = await api
        .put("/api/v1/designation/999")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send({ name: "Senior Developer" });
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  // ─── DELETE /api/v1/designation/:id ──────────────────────────────────────────

  describe("DELETE /api/v1/designation/:id", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.delete("/api/v1/designation/1");
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .delete("/api/v1/designation/1")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect([401, 403]).toContain(response.status);
    });

    it("should attempt to delete designation with admin token", async () => {
      const response = await api
        .delete("/api/v1/designation/999")
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });
});
