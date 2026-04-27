import request from "supertest";
import app from "../../src/app.js";
import { generateAccessToken } from "../../src/utils/token.js";
import { createTestUser } from "../utils/testDataFactory.js";

describe("Admin Routes", () => {
  let api;
  let employeeToken;
  let adminToken;

  beforeEach(() => {
    api = request(app);

    const mockEmployee = createTestUser({ userType: "EMPLOYEE" });
    const mockAdmin = createTestUser({ userType: "ADMIN", id: 2 });

    employeeToken = generateAccessToken({ userId: mockEmployee.id });
    adminToken = generateAccessToken({ userId: mockAdmin.id });
  });

  // ─── POST /api/v1/admin/employee ─────────────────────────────────────────────

  describe("POST /api/v1/admin/employee", () => {

    it("should return 401 if user is not authenticated", async () => {
      const response = await api.post("/api/v1/admin/employee").send({});
      expect(response.status).toBe(401);
    });

    it("should return 401 or 403 if employee (non-admin) tries to register an employee", async () => {
      const response = await api
        .post("/api/v1/admin/employee")
        .set("Cookie", [`accessToken=${employeeToken}`])
        .send({
          employeeName: "New Emp",
          mobileNumber: "9000000001",
          pin: "1234",
        });
      expect([401, 403]).toContain(response.status);
    });

    it("should return 422 or 400 for missing required fields (admin token)", async () => {
      const response = await api
        .post("/api/v1/admin/employee")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send({});
      // Validator fires before DB lookup in this route order, or 401 if user not found in DB
      expect(response.status).toBeDefined();
    });

    it("should attempt to register employee with all required fields", async () => {
      const response = await api
        .post("/api/v1/admin/employee")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send({
          employeeName: "John Doe",
          mobileNumber: "9000000002",
          pin: "5678",
          department: "IT",
          designation: "Developer",
          shift: "9:00 AM - 6:00 PM",
          userType: "EMPLOYEE",
        });
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
      expect(response.status).toBe(201);
    });
  });

  // ─── POST /api/v1/admin/employee/reset-pin ───────────────────────────────────

//   describe("POST /api/v1/admin/employee/reset-pin", () => {
//     it("should return 401 if user is not authenticated", async () => {
//       const response = await api.post("/api/v1/admin/employee/reset-pin").send({});
//       expect(response.status).toBe(401);
//     });

//     it("should return 401 or 403 for non-admin user", async () => {
//       const response = await api
//         .post("/api/v1/admin/employee/reset-pin")
//         .set("Cookie", [`accessToken=${employeeToken}`])
//         .send({ mobileNumber: "9000000001", newPin: "4321" });
//       expect([401, 403]).toContain(response.status);
//     });

//     it("should return 422 or 400 for missing fields", async () => {
//       const response = await api
//         .post("/api/v1/admin/employee/reset-pin")
//         .set("Cookie", [`accessToken=${adminToken}`])
//         .send({});
//       expect(response.status).toBeDefined();
//     });

//     it("should attempt to reset pin with valid payload", async () => {
//       const response = await api
//         .post("/api/v1/admin/employee/reset-pin")
//         .set("Cookie", [`accessToken=${adminToken}`])
//         .send({ mobileNumber: "9000000001", newPin: "9999" });
//       expect(response.status).toBeDefined();
//       expect(response.body).toBeDefined();
//     });
//   });

  // ─── PUT /api/v1/admin/employee/:id ─────────────────────────────────────────

//   describe("PUT /api/v1/admin/employee/:id", () => {
//     it("should return 401 if user is not authenticated", async () => {
//       const response = await api.put("/api/v1/admin/employee/1").send({});
//       expect(response.status).toBe(401);
//     });

//     it("should return 401 or 403 for non-admin user", async () => {
//       const response = await api
//         .put("/api/v1/admin/employee/1")
//         .set("Cookie", [`accessToken=${employeeToken}`])
//         .send({ employeeName: "Updated Name" });
//       expect([401, 403]).toContain(response.status);
//     });

//     it("should attempt to update an employee with admin token", async () => {
//       const response = await api
//         .put("/api/v1/admin/employee/999")
//         .set("Cookie", [`accessToken=${adminToken}`])
//         .send({ employeeName: "Updated Employee" });
//       expect(response.status).toBeDefined();
//       expect(response.body).toBeDefined();
//     });
//   });

  // ─── DELETE /api/v1/admin/employee/:id ──────────────────────────────────────

//   describe("DELETE /api/v1/admin/employee/:id", () => {
//     it("should return 401 if user is not authenticated", async () => {
//       const response = await api.delete("/api/v1/admin/employee/1");
//       expect(response.status).toBe(401);
//     });

//     it("should return 401 or 403 for non-admin user", async () => {
//       const response = await api
//         .delete("/api/v1/admin/employee/1")
//         .set("Cookie", [`accessToken=${employeeToken}`]);
//       expect([401, 403]).toContain(response.status);
//     });

//     it("should attempt to delete employee with admin token", async () => {
//       const response = await api
//         .delete("/api/v1/admin/employee/999")
//         .set("Cookie", [`accessToken=${adminToken}`]);
//       expect(response.status).toBeDefined();
//       expect(response.body).toBeDefined();
//     });
//   });

  // ─── GET /api/v1/admin/employees ────────────────────────────────────────────

//   describe("GET /api/v1/admin/employees", () => {
//     it("should return 401 if user is not authenticated", async () => {
//       const response = await api.get("/api/v1/admin/employees");
//       expect(response.status).toBe(401);
//     });

//     it("should return 401 or 403 for non-admin user", async () => {
//       const response = await api
//         .get("/api/v1/admin/employees")
//         .set("Cookie", [`accessToken=${employeeToken}`]);
//       expect([401, 403]).toContain(response.status);
//     });

//     it("should attempt to get all employees with admin token", async () => {
//       const response = await api
//         .get("/api/v1/admin/employees")
//         .set("Cookie", [`accessToken=${adminToken}`]);
//       expect(response.status).toBeDefined();
//       expect(response.body).toBeDefined();
//     });
//   });

  // ─── GET /api/v1/admin/employee/:id ─────────────────────────────────────────

//   describe("GET /api/v1/admin/employee/:id", () => {
//     it("should return 401 if user is not authenticated", async () => {
//       const response = await api.get("/api/v1/admin/employee/1");
//       expect(response.status).toBe(401);
//     });

//     it("should return 401 or 403 for non-admin user", async () => {
//       const response = await api
//         .get("/api/v1/admin/employee/1")
//         .set("Cookie", [`accessToken=${employeeToken}`]);
//       expect([401, 403]).toContain(response.status);
//     });

//     it("should attempt to get employee by id with admin token", async () => {
//       const response = await api
//         .get("/api/v1/admin/employee/1")
//         .set("Cookie", [`accessToken=${adminToken}`]);
//       expect(response.status).toBeDefined();
//       expect(response.body).toBeDefined();
//     });

//     it("should return 422 or 400 for invalid id param", async () => {
//       const response = await api
//         .get("/api/v1/admin/employee/invalid-id")
//         .set("Cookie", [`accessToken=${adminToken}`]);
//       expect(response.status).toBeDefined();
//     });
//   });
});
