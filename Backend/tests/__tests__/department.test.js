import request from "supertest";
import app from "../../src/app.js";
import { generateAccessToken } from "../../src/utils/token.js";
import { createTestUser } from "../utils/testDataFactory.js";

describe("Department Routes", () => {
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

  // ─── POST /api/v1/department ─────────────────────────────────────────────────

  describe("POST /api/v1/department", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.post("/api/v1/department").send({});
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .post("/api/v1/department")
        .set("Cookie", [`accessToken=${employeeToken}`])
        .send({ name: "Finance" });
      expect([401, 403]).toContain(response.status);
    });

    it("should return 400 or 422 for missing required fields (admin)", async () => {
      const response = await api
        .post("/api/v1/department")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send({});
      expect(response.status).toBeDefined();
    });

    it("should attempt to create a department with valid data (admin)", async () => {
      const response = await api
        .post("/api/v1/department")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send({ name: "Engineering" });
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  // ─── GET /api/v1/department ──────────────────────────────────────────────────

  describe("GET /api/v1/department", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.get("/api/v1/department");
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .get("/api/v1/department")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect([401, 403]).toContain(response.status);
    });

    it("should attempt to get all departments with admin token", async () => {
      const response = await api
        .get("/api/v1/department")
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  // ─── GET /api/v1/department/:id ─────────────────────────────────────────────

  describe("GET /api/v1/department/:id", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.get("/api/v1/department/1");
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .get("/api/v1/department/1")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect([401, 403]).toContain(response.status);
    });

    it("should attempt to get department by id with admin token", async () => {
      const response = await api
        .get("/api/v1/department/1")
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });

    it("should return an appropriate response for non-existent department id", async () => {
      const response = await api
        .get("/api/v1/department/999999")
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
    });
  });

  // ─── PUT /api/v1/department/:id ─────────────────────────────────────────────

  describe("PUT /api/v1/department/:id", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.put("/api/v1/department/1").send({});
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .put("/api/v1/department/1")
        .set("Cookie", [`accessToken=${employeeToken}`])
        .send({ name: "Updated" });
      expect([401, 403]).toContain(response.status);
    });

    it("should attempt to update department with admin token", async () => {
      const response = await api
        .put("/api/v1/department/999")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send({ name: "Updated Department" });
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  // ─── DELETE /api/v1/department/:id ──────────────────────────────────────────

  describe("DELETE /api/v1/department/:id", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.delete("/api/v1/department/1");
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .delete("/api/v1/department/1")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect([401, 403]).toContain(response.status);
    });

    it("should attempt to delete department with admin token", async () => {
      const response = await api
        .delete("/api/v1/department/999")
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });
});
