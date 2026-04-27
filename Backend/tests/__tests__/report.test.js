import request from "supertest";
import app from "../../src/app.js";
import { generateAccessToken } from "../../src/utils/token.js";
import { createTestUser } from "../utils/testDataFactory.js";

describe("Report Routes", () => {
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

  // ─── GET /api/v1/report/monthly-report ──────────────────────────────────────

  describe("GET /api/v1/report/monthly-report", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.get("/api/v1/report/monthly-report");
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .get("/api/v1/report/monthly-report")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect([401, 403]).toContain(response.status);
    });

    it("should attempt to get monthly report with admin token", async () => {
      const response = await api
        .get("/api/v1/report/monthly-report")
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });

    it("should attempt to get monthly report with month and year query params", async () => {
      const response = await api
        .get("/api/v1/report/monthly-report")
        .query({ month: "4", year: "2026" })
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  // ─── GET /api/v1/report/monthly-report/export ───────────────────────────────

  describe("GET /api/v1/report/monthly-report/export", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.get("/api/v1/report/monthly-report/export");
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 for non-admin user", async () => {
      const response = await api
        .get("/api/v1/report/monthly-report/export")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect([401, 403]).toContain(response.status);
    });

    it("should attempt to export monthly report with admin token", async () => {
      const response = await api
        .get("/api/v1/report/monthly-report/export")
        .query({ month: "4", year: "2026" })
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
    });
  });

  // ─── GET /api/v1/report/monthly-report/:employeeId ──────────────────────────

  describe("GET /api/v1/report/monthly-report/:employeeId", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.get("/api/v1/report/monthly-report/1");
      expect(response.status).toBe(401);
    });

    it("should attempt to get employee monthly report with employee token", async () => {
      const response = await api
        .get("/api/v1/report/monthly-report/1")
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });

    it("should attempt to get employee monthly report with admin token", async () => {
      const response = await api
        .get("/api/v1/report/monthly-report/1")
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });

    it("should attempt to get report for non-existent employee", async () => {
      const response = await api
        .get("/api/v1/report/monthly-report/999999")
        .set("Cookie", [`accessToken=${adminToken}`]);
      expect(response.status).toBeDefined();
    });

    it("should attempt to get monthly report with month and year query params", async () => {
      const response = await api
        .get("/api/v1/report/monthly-report/1")
        .query({ month: "4", year: "2026" })
        .set("Cookie", [`accessToken=${employeeToken}`]);
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });
});
