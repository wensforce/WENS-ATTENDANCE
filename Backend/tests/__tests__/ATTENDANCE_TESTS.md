# Attendance API Test Cases

## Overview
This document describes the test cases for the check-in and check-out API endpoints.

## Test Suite: Attendance Routes

### Prerequisites
- Valid authentication token required for all endpoints
- Image upload capability (multipart/form-data)
- Location coordinates (latitude/longitude)

## Check-In API Tests (`POST /api/v1/attendance/check-in`)

### 1. Authentication Tests
- ✅ **should return 401 if user is not authenticated**
  - Tests that unauthenticated requests are rejected
  - Expected: HTTP 401 Unauthorized

- ✅ **should handle invalid token format for check-in**
  - Tests that invalid tokens are rejected
  - Expected: HTTP 401 Unauthorized

### 2. Required Field Validation
- ✅ **should return 400 if check-in image is missing**
  - Tests validation when image file is not provided
  - Expected: HTTP 400 with message "Check-in image is required"

- ✅ **should return 400 if location coordinates are missing (no lat)**
  - Tests validation when latitude is missing
  - Expected: HTTP 400 with message "Check-in location is required"

- ✅ **should return 400 if location coordinates are missing (no lng)**
  - Tests validation when longitude is missing
  - Expected: HTTP 400 with message "Check-in location is required"

- ✅ **should handle check-in with missing both lat and lng**
  - Tests validation when both coordinates are missing
  - Expected: HTTP 400 with message "Check-in location is required"

### 3. Business Logic Tests
- **should return 400 if user has already checked in today**
  - Prevents duplicate check-ins on the same day
  - Expected: HTTP 400 with message "You have already checked in today"

- **should return 400 if location is not within allowed area**
  - Validates user location against their assigned work location
  - Expected: HTTP 400 with message "You are not within the allowed check-in location"

- **should successfully check in with valid data**
  - Creates attendance record with all valid parameters
  - Expected: HTTP 201 with attendance data

### 4. Error Handling
- **should handle invalid user**
  - Tests behavior when user is not found in database
  - Expected: HTTP 400 with message "Invalid user or check-in image"

- **should handle file upload failure**
  - Tests handling of S3 upload failures
  - Expected: HTTP 400 with message "Invalid user or check-in image"

## Check-Out API Tests (`POST /api/v1/attendance/check-out`)

### 1. Authentication Tests
- ✅ **should return 401 if user is not authenticated**
  - Tests that unauthenticated requests are rejected
  - Expected: HTTP 401 Unauthorized

- ✅ **should handle invalid token format for check-out**
  - Tests that invalid tokens are rejected
  - Expected: HTTP 401 Unauthorized

### 2. Required Field Validation
- ✅ **should return 400 if check-out image is missing**
  - Tests validation when image file is not provided
  - Expected: HTTP 400 with message "Check-out image is required"

- ✅ **should return 400 if location coordinates are missing (no lat)**
  - Tests validation when latitude is missing
  - Expected: HTTP 400 with message "Check-out location is required"

- ✅ **should return 400 if location coordinates are missing (no lng)**
  - Tests validation when longitude is missing
  - Expected: HTTP 400 with message "Check-out location is required"

- ✅ **should handle check-out with missing both lat and lng**
  - Tests validation when both coordinates are missing
  - Expected: HTTP 400 with message "Check-out location is required"

### 3. Business Logic Tests
- **should return 400 if user has not checked in**
  - Prevents check-out without prior check-in
  - Expected: HTTP 400 with message "You have not checked in yet"

- **should return 400 if trying to checkout from old check-in (>24 hours)**
  - Prevents check-out from stale check-in records
  - Expected: HTTP 400 with message "Cannot checkout from a check-in that was more than 24 hours ago"

- **should allow checkout outside work location and mark it**
  - Allows check-out from different location but marks it as outside
  - Expected: HTTP 200 with `checkoutOutside: true`

- **should calculate overtime for check-out**
  - Calculates extra time based on shift hours
  - Expected: HTTP 200 with `extraTime` field populated

- **should handle checkout on holiday with extra overtime calculation**
  - Applies holiday overtime rules
  - Expected: HTTP 200 with increased overtime calculation

- **should successfully check out with valid data**
  - Updates attendance record with check-out details
  - Expected: HTTP 200 with updated attendance data

### 4. Error Handling
- **should handle file upload failure during checkout**
  - Tests handling of S3 upload failures
  - Expected: HTTP 400 with message "Invalid check-out image"

- **should handle user not found during checkout**
  - Tests behavior when user is not found in database
  - Expected: HTTP 400 with message "You have not checked in yet"

## Running the Tests

### Option 1: Run all attendance tests
```bash
npm test -- tests/__tests__/attendance.test.js
```

### Option 2: Run with coverage
```bash
npm run test:coverage -- tests/__tests__/attendance.test.js
```

### Option 3: Run in watch mode
```bash
npm run test:watch -- tests/__tests__/attendance.test.js
```

### Option 4: Force exit after tests (avoid hanging)
```bash
npm test -- tests/__tests__/attendance.test.js --forceExit
```

## Test Data Requirements

### Valid Test User
```javascript
{
  id: 1,
  employeeName: "Test User",
  employeeId: "EMP001",
  department: "IT",
  designation: "Developer",
  shift: "9:00 AM - 5:00 PM",
  email: "test@example.com",
  mobileNumber: "1234567890",
  userType: "EMPLOYEE",
  workLocation: JSON.stringify({ lat: 28.6139, lng: 77.2090 }),
  weekendOff: JSON.stringify(["Saturday", "Sunday"])
}
```

### Valid Request Format

**Check-In Request:**
```javascript
POST /api/v1/attendance/check-in
Headers: Cookie: accessToken=<valid-jwt-token>
Body: multipart/form-data
  - checkInImage: <file>
  - lat: "28.6139"
  - lng: "77.2090"
  - address: "Test Address"
```

**Check-Out Request:**
```javascript
POST /api/v1/attendance/check-out
Headers: Cookie: accessToken=<valid-jwt-token>
Body: multipart/form-data
  - checkOutImage: <file>
  - lat: "28.6139"
  - lng: "77.2090"
  - address: "Test Address"
```

## Test Coverage

Current test coverage includes:
- ✅ Authentication and authorization
- ✅ Input validation for required fields
- ✅ Location coordinate validation
- ✅ Image upload requirement validation
- ✅ Endpoint existence verification
- ⚠️ Business logic (requires database setup)
- ⚠️ Integration with S3 storage (requires mocking)
- ⚠️ Overtime calculation (requires database setup)

## Notes

1. **Integration Tests**: Some tests require a database connection and may need proper test database setup or mocking
2. **S3 Mocking**: File upload tests may require S3 service mocking for full coverage
3. **Location Validation**: Tests involving location verification require proper mock configuration
4. **Token Generation**: Uses actual JWT token generation for realistic testing

## Future Enhancements

- [ ] Add database transaction rollback for integration tests
- [ ] Mock S3 upload service
- [ ] Add tests for concurrent check-in attempts
- [ ] Add tests for different shift timings
- [ ] Add tests for weekend/holiday scenarios
- [ ] Add performance tests for image upload
- [ ] Add tests for various image formats and sizes
