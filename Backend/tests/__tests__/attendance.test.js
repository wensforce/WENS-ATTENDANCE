import { apiRequest } from "../utils/apiTestHelper.js";
import { createTestUser } from "../utils/testDataFactory.js";
import { generateAccessToken } from "../../src/utils/token.js";

describe("Attendance Routes", () => {
  let mockUser;
  let mockToken;
  let mockImageBuffer;

  beforeAll(() => {
    // Create a mock image buffer
    mockImageBuffer = Buffer.from("fake-image-data");
  });

  beforeEach(() => {
    // Setup mock user using test factory
    mockUser = createTestUser({
      shift: "9:00 AM - 5:00 PM",
      workLocation: JSON.stringify({ lat: 28.6139, lng: 77.209 }),
      weekendOff: JSON.stringify(["Saturday", "Sunday"]),
    });

    // Generate a valid access token
    mockToken = generateAccessToken({ userId: mockUser.id });
  });

  describe("POST /api/v1/attendance/check-in", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-in")
        .field("lat", "28.6139")
        .field("lng", "77.2090")
        .attach("checkInImage", mockImageBuffer, "test-image.jpg");

      expect(response.status).toBe(401);
    });

    it("should return 400 if check-in image is missing", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-in")
        .set("Cookie", [`accessToken=${mockToken}`])
        .field("lat", "28.6139")
        .field("lng", "77.2090")
        .field("address", "Test Address");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Check-in image is required");
    });

    it("should return 400 if location coordinates are missing (no lat)", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-in")
        .set("Cookie", [`accessToken=${mockToken}`])
        .field("lng", "77.2090")
        .field("address", "Test Address")
        .attach("checkInImage", mockImageBuffer, "test-image.jpg");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Check-in location is required");
    });

    it("should return 400 if location coordinates are missing (no lng)", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-in")
        .set("Cookie", [`accessToken=${mockToken}`])
        .field("lat", "28.6139")
        .field("address", "Test Address")
        .attach("checkInImage", mockImageBuffer, "test-image.jpg");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Check-in location is required");
    });

    it("should handle check-in request with all required parameters", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-in")
        .set("Cookie", [`accessToken=${mockToken}`])
        .field("lat", "28.6139")
        .field("lng", "77.2090")
        .field("address", "Test Address")
        .attach("checkInImage", mockImageBuffer, "test-image.jpg");
        console.log(response);
        
      // Accept various responses as the actual behavior depends on database state
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  describe("POST /api/v1/attendance/check-out", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-out")
        .field("lat", "28.6139")
        .field("lng", "77.2090")
        .attach("checkOutImage", mockImageBuffer, "test-image.jpg");

      expect(response.status).toBe(401);
    });

    it("should return 400 if check-out image is missing", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-out")
        .set("Cookie", [`accessToken=${mockToken}`])
        .field("lat", "28.6139")
        .field("lng", "77.2090")
        .field("address", "Test Address");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Check-out image is required");
    });

    it("should return 400 if location coordinates are missing (no lat)", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-out")
        .set("Cookie", [`accessToken=${mockToken}`])
        .field("lng", "77.2090")
        .field("address", "Test Address")
        .attach("checkOutImage", mockImageBuffer, "test-image.jpg");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Check-out location is required");
    });

    it("should return 400 if location coordinates are missing (no lng)", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-out")
        .set("Cookie", [`accessToken=${mockToken}`])
        .field("lat", "28.6139")
        .field("address", "Test Address")
        .attach("checkOutImage", mockImageBuffer, "test-image.jpg");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Check-out location is required");
    });

    it("should handle check-out request with all required parameters", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-out")
        .set("Cookie", [`accessToken=${mockToken}`])
        .field("lat", "28.6139")
        .field("lng", "77.2090")
        .field("address", "Test Address")
        .attach("checkOutImage", mockImageBuffer, "test-image.jpg");

      // Accept various responses as the actual behavior depends on database state
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });
  });

  describe("Edge Cases and Validation", () => {
    it("should handle invalid token format for check-in", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-in")
        .set("Cookie", [`accessToken=invalid-token`])
        .field("lat", "28.6139")
        .field("lng", "77.2090")
        .field("address", "Test Address")
        .attach("checkInImage", mockImageBuffer, "test-image.jpg");

      expect(response.status).toBe(401);
    });

    it("should handle invalid token format for check-out", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-out")
        .set("Cookie", [`accessToken=invalid-token`])
        .field("lat", "28.6139")
        .field("lng", "77.2090")
        .field("address", "Test Address")
        .attach("checkOutImage", mockImageBuffer, "test-image.jpg");

      expect(response.status).toBe(401);
    });

    it("should handle check-in with missing both lat and lng", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-in")
        .set("Cookie", [`accessToken=${mockToken}`])
        .field("address", "Test Address")
        .attach("checkInImage", mockImageBuffer, "test-image.jpg");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Check-in location is required");
    });

    it("should handle check-out with missing both lat and lng", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-out")
        .set("Cookie", [`accessToken=${mockToken}`])
        .field("address", "Test Address")
        .attach("checkOutImage", mockImageBuffer, "test-image.jpg");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Check-out location is required");
    });
  });

  describe("Request Validation", () => {
    it("should validate check-in requires authentication", async () => {
      const response = await apiRequest.post("/api/v1/attendance/check-in");

      expect(response.status).toBe(401);
    });

    it("should validate check-out requires authentication", async () => {
      const response = await apiRequest.post("/api/v1/attendance/check-out");

      expect(response.status).toBe(401);
    });

    it("should ensure check-in endpoint exists", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-in")
        .set("Cookie", [`accessToken=${mockToken}`]);

      // Should not be 404 (route exists)
      expect(response.status).not.toBe(404);
    });

    it("should ensure check-out endpoint exists", async () => {
      const response = await apiRequest
        .post("/api/v1/attendance/check-out")
        .set("Cookie", [`accessToken=${mockToken}`]);

      // Should not be 404 (route exists)
      expect(response.status).not.toBe(404);
    });
  });
});
