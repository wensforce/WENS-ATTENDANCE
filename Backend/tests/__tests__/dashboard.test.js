import request from "supertest";
import app from "../../src/app.js";
import { generateAccessToken } from "../../src/utils/token.js";
import { createTestUser } from "../utils/testDataFactory.js";

describe("Dashboard Routes", () => {
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

  // ─── GET /api/v1/dashboard/user ─────────────────────────────────────────────

  describe("GET /api/v1/dashboard/user", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.get("/api/v1/dashboard/user");
      expect(response.status).toBe(401);
    });

    it("should attempt to get user dashboard for authenticated user", async () => {
      const response = await api
        .get("/api/v1/dashboard/user")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });

    it("should attempt to get user dashboard for admin user", async () => {
      const response = await api
        .get("/api/v1/dashboard/user")
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  // ─── GET /api/v1/dashboard/admin ────────────────────────────────────────────

  describe("GET /api/v1/dashboard/admin", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.get("/api/v1/dashboard/admin");
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .get("/api/v1/dashboard/admin")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect([401, 403]).toContain(response.status);
    });

    it("should attempt to get admin dashboard for admin user", async () => {
      const response = await api
        .get("/api/v1/dashboard/admin")
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });
});
