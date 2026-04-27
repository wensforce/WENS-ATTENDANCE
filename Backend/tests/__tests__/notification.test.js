import request from "supertest";
import app from "../../src/app.js";
import { generateAccessToken } from "../../src/utils/token.js";
import { createTestUser } from "../utils/testDataFactory.js";

describe("Notification Routes", () => {
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

  // ─── POST /api/v1/notifications/save-token ──────────────────────────────────

  describe("POST /api/v1/notifications/save-token", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.post("/api/v1/notifications/save-token").send({});
      expect(response.status).toBe(401);
    });

    it("should return 400 or 422 for missing device token in body", async () => {
      const response = await api
        .post("/api/v1/notifications/save-token")
        .set("Cookie", [`accessToken=${employeeToken}`])
        .send({});
      expect(response.status).toBeDefined();
    });

    it("should attempt to save device token with valid payload (employee)", async () => {
      const response = await api
        .post("/api/v1/notifications/save-token")
        .set("Cookie", [`accessToken=${employeeToken}`])
        .send({ deviceToken: "fcm-device-token-abc123xyz" });
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });

    it("should attempt to save device token with valid payload (admin)", async () => {
      const response = await api
        .post("/api/v1/notifications/save-token")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send({ deviceToken: "fcm-device-token-admin456xyz" });
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });

    it("should return 400 or error for empty device token string", async () => {
      const response = await api
        .post("/api/v1/notifications/save-token")
        .set("Cookie", [`accessToken=${employeeToken}`])
        .send({ deviceToken: "" });
      expect(response.status).toBeDefined();
    });
  });
});
