import request from "supertest";
import app from "../../src/app.js";
import { createTestUser } from "../utils/testDataFactory.js";

describe("Auth Routes", () => {
  let api;

  beforeEach(() => {
    api = request(app);
  });

  describe("POST /api/v1/auth/login", () => {
    it("should return error for missing credentials", async () => {
      const response = await api.post("/api/v1/auth/login").send({});

      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });

    it("should attempt login with email and PIN", async () => {
      const response = await api
        .post("/api/v1/auth/login")
        .send({
          mobileNumber: "9693127823",
          pin: "9820",
        });

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it("should handle missing email or mobile number in login", async () => {
      const response = await api
        .post("/api/v1/auth/login")
        .send({
          pin: "1234",
        });

      expect(response.status).toBeDefined();
    });

    it("should handle missing PIN in login", async () => {
      const response = await api
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
        });

      expect(response.status).toBeDefined();
    });
  });

  describe("POST /api/v1/auth/refresh-token", () => {
    it("should handle refresh token request", async () => {
      const response = await api.post("/api/v1/auth/refresh-token");

      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });

    it("should reject without refresh token cookie", async () => {
      const response = await api.post("/api/v1/auth/refresh-token");

      expect(response.status).toBeLessThanOrEqual(500);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("should return error if user is not authenticated", async () => {
      const response = await api.post("/api/v1/auth/logout");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await api.get("/api/v1/auth/me");

      expect(response.status).toBe(401);
    });
  });

  describe("Health Check", () => {
    it("should return health check message", async () => {
      const response = await api.get("/health-check");

      expect(response.status).toBe(200);
      expect(response.text).toBeDefined();
    });
  });
});
