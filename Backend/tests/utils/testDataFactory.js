// Test utilities for creating test data
export const createTestUser = (overrides = {}) => {
  return {
    id: 1,
    employeeName: "Test User",
    employeeId: "EMP001",
    department: "IT",
    designation: "Developer",
    shift: "Morning",
    email: "test@example.com",
    mobileNumber: "1234567890",
    pin: "$2b$10$3EozKEmzF/l9bYJ663yOU.O0d35gbunkS9Hki8jaFt8hP2Fa.GwDW", // hashed pin
    refreshToken: null,
    userType: "EMPLOYEE",
    workLocation: null,
    weekendOff: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createTestUserWithRefreshToken = (overrides = {}) => {
  return createTestUser({
    refreshToken: "test-refresh-token-12345",
    ...overrides,
  });
};

export const createTestAttendance = (overrides = {}) => {
  return {
    id: 1,
    userId: 1,
    date: new Date(),
    checkInTime: new Date(),
    checkInLocation: JSON.stringify({ lat: 28.6139, lng: 77.2090, address: "Test Address" }),
    status: "Present",
    checkInPhoto: "test-checkin-photo.jpg",
    checkOutTime: null,
    checkOutLocation: null,
    checkOutPhoto: null,
    extraTime: 0,
    checkoutOutside: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createTestAttendanceWithCheckout = (overrides = {}) => {
  return createTestAttendance({
    checkOutTime: new Date(),
    checkOutLocation: JSON.stringify({ lat: 28.6139, lng: 77.2090, address: "Test Address" }),
    checkOutPhoto: "test-checkout-photo.jpg",
    extraTime: 0,
    checkoutOutside: false,
    ...overrides,
  });
};

export const mockValidPin = "1234"; // This would be hashed in real scenarios
export const mockValidEmail = "test@example.com";
export const mockValidMobileNumber = "1234567890";
export const mockValidLocation = { lat: 28.6139, lng: 77.2090, address: "Test Office Location" };
