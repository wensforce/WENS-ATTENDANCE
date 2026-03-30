# Attendance Management API Documentation

## Overview
The Attendance API manages employee check-in/check-out operations with location verification and image uploads. It supports both regular and special duty attendance tracking, allowing employees to mark their attendance with photographic proof and GPS coordinates. The system calculates overtime, tracks work hours, and maintains detailed attendance records for reporting and compliance.

---

## Access Control

| Endpoint | Permission | Role Required |
|----------|-----------|---------------|
| GET / | Admin only | Admin |
| POST /check-in | Authenticated users | Employee/Admin |
| POST /check-out | Authenticated users | Employee/Admin |
| POST /special-check-in | Authenticated users | Employee/Admin |
| POST /special-check-out | Authenticated users | Employee/Admin |
| GET /calender | Authenticated users | Employee/Admin |
| GET /get-details/:attendanceId | Authenticated users | Employee/Admin |
| GET /get-special-details/:attendanceId | Authenticated users | Employee/Admin |
| PUT /update/:attendanceId | Admin only | Admin |
| PUT /update-special/:attendanceId | Admin only | Admin |
| DELETE /delete | Admin only | Admin |
| DELETE /delete-special | Admin only | Admin |

**Authentication:** All endpoints require valid `accessToken` (authMiddleware)
**Admin Operations:** Update/Delete operations require both `authMiddleware` and `adminMiddleware`

---

## Features

- **Location Verification:** GPS coordinates are validated against allowed work locations
- **Image Upload:** Check-in and check-out require photographic proof stored in S3
- **Image Retrieval:** Presigned URLs for secure photo access without exposing S3 keys
- **Overtime Calculation:** Automatically calculates extra work hours beyond shift hours
- **Holiday & Weekend Detection:** Identifies holidays and week-off days for overtime classification
- **Multi-Day Shift Support:** Handles check-ins spanning multiple days (up to 24 hours)
- **Special Duty Tracking:** Separate attendance type for special duty assignments with work hours tracking
- **Advanced Calendar View:** Comprehensive attendance calendar with holiday, weekend, and absence tracking
- **Bulk Operations:** Admin ability to update and delete attendance records in bulk

---

## Endpoints

### 1. Get All Attendance Records (Admin Only)
**Endpoint:** `GET /api/attendance/`

**Authentication:** Required (authMiddleware + adminMiddleware)

**Query Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| page | Integer | No | Page number for pagination | `1` |
| limit | Integer | No | Records per page | `20` |
| userId | Number/String | No | Filter by employee ID | `emp-001` |
| startDate | Date | No | Filter from date (ISO 8601) | `2026-03-01` |
| endDate | Date | No | Filter to date (ISO 8601) | `2026-03-31` |
| search | String | No | Search in status, check-in/out locations | `PRESENT` |

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/attendance/?page=1&limit=20&userId=emp-001&startDate=2026-03-01&endDate=2026-03-31" \
  -H "Cookie: accessToken=your-jwt-token"
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Attendance records retrieved successfully",
  "data": {
    "attendanceRecords": [
      {
        "id": 1,
        "userId": "emp-001",
        "date": "2026-03-07T00:00:00.000Z",
        "checkInTime": "2026-03-07T08:30:15.000Z",
        "checkInLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
        "checkInPhoto": "s3-key-path/image.jpg",
        "status": "PRESENT",
        "checkOutTime": "2026-03-07T18:45:30.000Z",
        "checkOutLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
        "checkOutPhoto": "s3-key-path/checkout.jpg",
        "extraTime": 130,
        "checkoutOutside": false
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 85,
      "limit": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Response (Failure - 401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Process:**
1. Validates admin authorization
2. Builds query filters based on provided parameters
3. Fetches paginated attendance records
4. Calculates total count and pagination info
5. Returns records sorted by date (descending)

**Error Cases:**
- 401: Invalid/expired token or insufficient permissions
- 500: Database error

---

### 2. Check-In
**Endpoint:** `POST /api/attendance/check-in`

**Authentication:** Required (authMiddleware)

**Request Headers:**
```
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| checkInImage | File | Yes | Image file (JPEG/PNG) - uploaded as file |
| lat | Number | Yes | Latitude of check-in location |
| lng | Number | Yes | Longitude of check-in location |
| address | String | No | Human-readable address |

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Cookie: accessToken=your-jwt-token" \
  -F "checkInImage=@/path/to/image.jpg" \
  -F "lat=28.6139" \
  -F "lng=77.2090" \
  -F "address=Delhi, India"
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "id": 1,
    "userId": "emp-001",
    "date": "2026-03-07T00:00:00.000Z",
    "checkInTime": "2026-03-07T08:30:15.000Z",
    "checkInLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
    "checkInPhoto": "s3-key-path/image.jpg",
    "status": "PRESENT",
    "checkOutTime": null,
    "checkOutLocation": null,
    "checkOutPhoto": null,
    "extraTime": 0,
    "checkoutOutside": false
  }
}
```

**Response (Failure - 400):**
```json
{
  "success": false,
  "message": "Check-in image is required" 
  // or "Check-in location is required"
  // or "You have already checked in today"
  // or "You are not within the allowed check-in location"
  // or "You have already checked in for special duty, checkout first"
}
```

**Response (Failure - 401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Business Rules:**
1. Only one check-in allowed per day (first check-in wins)
2. Check-in location must be within allowed work location radius
3. Cannot check-in if already checked-in for special duty on the same day
4. Check-in image is mandatory and must be a valid image file
5. GPS coordinates are mandatory
6. Status is automatically determined based on user's shift timing

**Status Values:**
- `PRESENT`: Normal attendance during shift hours
- `EARLY`: Check-in before shift start time
- `LATE`: Check-in after shift start time

**Process:**
1. Validates request data (image, coordinates)
2. Checks for existing check-in/special check-in on same day
3. Uploads check-in image to S3 storage
4. Verifies user's work location
5. Validates GPS coordinates against allowed location
6. Creates attendance record with calculated status
7. Returns created attendance record

**Error Cases:**
- 400: Missing image, coordinates, or duplicate check-in
- 401: Invalid/expired token
- 400: Location verification failed
- 500: Server error or S3 upload failure

---

### 2. Check-Out
**Endpoint:** `POST /api/attendance/check-out`

**Authentication:** Required (authMiddleware)

**Request Headers:**
```
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| checkOutImage | File | Yes | Image file (JPEG/PNG) - uploaded as file |
| lat | Number | Yes | Latitude of check-out location |
| lng | Number | Yes | Longitude of check-out location |
| address | String | No | Human-readable address |

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/attendance/check-out \
  -H "Cookie: accessToken=your-jwt-token" \
  -F "checkOutImage=@/path/to/image.jpg" \
  -F "lat=28.6139" \
  -F "lng=77.2090" \
  -F "address=Delhi, India"
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Check-out successful",
  "data": {
    "id": 1,
    "userId": "emp-001",
    "date": "2026-03-07T00:00:00.000Z",
    "checkInTime": "2026-03-07T08:30:15.000Z",
    "checkInLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
    "checkInPhoto": "s3-key-path/checkin.jpg",
    "checkOutTime": "2026-03-07T18:45:30.000Z",
    "checkOutLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
    "checkOutPhoto": "s3-key-path/checkout.jpg",
    "status": "PRESENT",
    "extraTime": 130,
    "checkoutOutside": false
  }
}
```

**Response (Failure - 400):**
```json
{
  "success": false,
  "message": "Check-out image is required"
  // or "Check-out location is required"
  // or "You have not checked in yet"
  // or "Cannot checkout from a check-in that was more than 24 hours ago"
  // or "Invalid check-out image"
}
```

**Business Rules:**
1. User must have an active check-in (no check-out) from the same or previous day
2. Supports multi-day shifts up to 24 hours
3. Automatic overtime calculation based on shift hours and work duration
4. If check-out is on different date than check-in, 1 hour buffer is allowed
5. Holiday/Weekend status affects overtime status designation
6. Checkout location can be outside allowed location (checkoutOutside flag indicates this)

**Overtime Calculation:**
- Compares actual work hours with employee's shift duration
- Takes into account holidays and weeks-off
- Stores result in `extraTime` field (in minutes)
- Updates status to "OVERTIME" if applicable

**Status Values (on checkout):**
- `PRESENT`: Normal attendance, within shift hours
- `OVERTIME`: Work extending beyond shift hours or on holiday/weekend

**Process:**
1. Validates request data (image, coordinates)
2. Finds most recent unchecked-out attendance record
3. Validates checkout timing (not more than 24 hours from check-in)
4. Uploads check-out image to S3
5. Calculates overtime based on shift, holidays, and week-off
6. Updates attendance record with checkout details
7. Returns updated record

**Error Cases:**
- 400: Missing image, coordinates, or no active check-in
- 400: Checkout attempt more than 24 hours after check-in
- 401: Invalid/expired token
- 500: Server error or S3 upload failure

**Field Descriptions:**
- `extraTime`: Work hours in minutes beyond shift end time
- `checkoutOutside`: Boolean - true if checkout location outside allowed radius

---

### 3. Special Duty Check-In
**Endpoint:** `POST /api/attendance/special-check-in`

**Authentication:** Required (authMiddleware)

**Request Headers:**
```
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| checkInImage | File | Yes | Image file (JPEG/PNG) - uploaded as file |
| lat | Number | Yes | Latitude of check-in location |
| lng | Number | Yes | Longitude of check-in location |
| address | String | No | Human-readable address |

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/attendance/special-check-in \
  -H "Cookie: accessToken=your-jwt-token" \
  -F "checkInImage=@/path/to/image.jpg" \
  -F "lat=28.6139" \
  -F "lng=77.2090" \
  -F "address=Delhi, India"
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Special Duty Check-in successful",
  "data": {
    "id": 1,
    "userId": "emp-001",
    "date": "2026-03-07T00:00:00.000Z",
    "checkInTime": "2026-03-07T09:00:00.000Z",
    "checkInLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
    "checkInPhoto": "s3-key-path/special-checkin.jpg",
    "checkOutTime": null,
    "checkOutLocation": null,
    "checkOutPhoto": null,
    "workHours": null
  }
}
```

**Response (Failure - 400):**
```json
{
  "success": false,
  "message": "Check-in image is required"
  // or "Check-in location is required"
  // or "You have already checked in for special duty"
  // or "You have already checked in normal today, checkout first for Special Duty"
}
```

**Business Rules:**
1. Only one special duty check-in allowed per day
2. Cannot have both normal and special duty check-in on the same day
3. Must not have unchecked-out normal attendance record on the same day
4. Image and GPS coordinates are mandatory
5. Location verification is checked but not enforced (for flexibility in special duty)

**Process:**
1. Validates request data (image, coordinates)
2. Checks for existing special duty check-in on same day
3. Checks for active normal attendance record on same day
4. Uploads check-in image to S3
5. Creates special attendance record
6. Returns created record

**Error Cases:**
- 400: Missing image or coordinates
- 400: Duplicate special duty check-in on same day
- 400: Active normal attendance on same day
- 401: Invalid/expired token
- 500: Server error or S3 upload failure

---

### 4. Special Duty Check-Out
**Endpoint:** `POST /api/attendance/special-check-out`

**Authentication:** Required (authMiddleware)

**Request Headers:**
```
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| checkOutImage | File | Yes | Image file (JPEG/PNG) - uploaded as file |
| lat | Number | Yes | Latitude of check-out location |
| lng | Number | Yes | Longitude of check-out location |
| address | String | No | Human-readable address |

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/attendance/special-check-out \
  -H "Cookie: accessToken=your-jwt-token" \
  -F "checkOutImage=@/path/to/image.jpg" \
  -F "lat=28.6139" \
  -F "lng=77.2090" \
  -F "address=Delhi, India"
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Check-out successful",
  "data": {
    "id": 1,
    "userId": "emp-001",
    "date": "2026-03-07T00:00:00.000Z",
    "checkInTime": "2026-03-07T09:00:00.000Z",
    "checkInLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
    "checkInPhoto": "s3-key-path/special-checkin.jpg",
    "checkOutTime": "2026-03-07T17:30:00.000Z",
    "checkOutLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
    "checkOutPhoto": "s3-key-path/special-checkout.jpg",
    "workHours": "8:30"
  }
}
```

**Response (Failure - 400):**
```json
{
  "success": false,
  "message": "Check-out image is required"
  // or "Check-out location is required"
  // or "You have not checked in yet"
  // or "Cannot checkout from a check-in that was more than 24 hours ago"
  // or "Invalid check-out image"
}
```

**Business Rules:**
1. User must have an active special duty check-in (no check-out)
2. Maximum 24-hour checkout window from check-in
3. Work hours are calculated in `HH:MM` format (e.g., "8:30")
4. Image and GPS coordinates are mandatory

**Work Hours Calculation:**
- Format: `HH:MM` where HH is hours and MM is minutes
- Example: "8:30" = 8 hours 30 minutes
- Calculated as: (checkOutHour - checkInHour):(checkOutMinutes - checkInMinutes)

**Process:**
1. Validates request data (image, coordinates)
2. Finds most recent unchecked-out special attendance record
3. Validates checkout timing (not more than 24 hours from check-in)
4. Uploads check-out image to S3
5. Calculates work hours in HH:MM format
6. Updates special attendance record with checkout details
7. Returns updated record

**Error Cases:**
- 400: Missing image or coordinates
- 400: No active special duty check-in
- 400: Checkout more than 24 hours after check-in
- 401: Invalid/expired token
- 500: Server error or S3 upload failure

---

### 5. Get Attendance Calendar
**Endpoint:** `GET /api/attendance/calender`

**Authentication:** Required (authMiddleware)

**Query Parameters (at least one required):**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| userId | Number/String | Yes | Employee ID to fetch attendance for | `emp-001` |
| month | Integer | Yes | Month (1-12) | `3` |
| year | Integer | Yes | Year | `2026` |

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/attendance/calender?userId=emp-001&month=3&year=2026" \
  -H "Cookie: accessToken=your-jwt-token"
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Attendance calendar retrieved successfully",
  "data": {
    "attendance": [
      {
        "id": 1,
        "date": "2026-03-02",
        "status": "PRESENT"
      },
      {
        "id": 2,
        "date": "2026-03-03",
        "status": "LATE"
      },
      {
        "specialId": 5,
        "date": "2026-03-04",
        "status": "SPECIAL"
      },
      {
        "id": 3,
        "specialId": 6,
        "date": "2026-03-05",
        "status": "PRESENT_SPECIAL"
      },
      {
        "id": 4,
        "date": "2026-03-06",
        "status": "OVERTIME"
      },
      {
        "date": "2026-03-07",
        "status": "ABSENT"
      },
      {
        "holidayId": 1,
        "date": "2026-03-08",
        "status": "HOLIDAY"
      },
      {
        "date": "2026-03-09",
        "status": "WEEKOFF"
      }
    ],
    "pagination": {
      "month": 3,
      "year": 2026
    }
  }
}
```

**Response (Failure - 400):**
```json
{
  "success": false,
  "message": "Invalid query parameters"
}
```

**Response (Failure - 401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Validation Rules:**
| Parameter | Rules | Error Message |
|-----------|-------|---------------|
| userId | Required, valid string/number | "User ID is required" |
| month | Required, 1-12 | "Month must be an integer between 1 and 12" |
| year | Required, valid integer | "Year must be a valid integer" |

**Status Descriptions:**

| Status | Description |
|--------|-------------|
| `PRESENT` | Normal check-in and check-out, within shift hours |
| `EARLY` | Check-in before shift start time |
| `LATE` | Check-in after shift start time |
| `OVERTIME` | Work extending beyond regular shift hours or on holiday/weekend |
| `SPECIAL` | Special duty attendance only (no normal attendance) |
| `PRESENT_SPECIAL` | Both normal and special duty attendance on same day (merged record) |
| `ABSENT` | No attendance record for the day (after earliest attendance date and on or before today) |
| `HOLIDAY` | Holiday or declared leave day |
| `WEEKOFF` | Designated weekend/week-off day for the employee |

**Record Merging Logic:**
1. Regular attendance records are retrieved for the date range
2. Special duty records are retrieved for the date range
3. If special duty record exists for same date as regular attendance, merged as `PRESENT_SPECIAL`
4. If only special duty record exists (no regular attendance), shows as `SPECIAL`
5. If only regular attendance exists, shows with status from that record
6. For dates with no attendance record:
   - If date is a holiday, shows as `HOLIDAY`
   - If date is a weekend/week-off day, shows as `WEEKOFF`
   - Otherwise if before or on today and on or after oldest attendance date, shows as `ABSENT`
   - Future dates (after today) are not included in results
7. Records are sorted chronologically by date

**Advanced Features:**
- Holiday detection automatically marks declared leave periods
- Weekend detection respects each employee's designated week-off days
- Absence tracking only applies to active attendance history

**Process:**
1. Validates query parameters (userId, month, year)
2. Calculates start date (1st of month) and end date (last of month)
3. Fetches all regular attendance records in date range
4. Fetches all special duty attendance records in date range
5. Merges records with special duty taking priority
6. Returns combined attendance array with pagination info

**Error Cases:**
- 400: Missing or invalid query parameters
- 401: Invalid/expired token
- 404: User not found
- 500: Database error

**Notes:**
- Endpoint path is `/calender` (note the spelling - this is a documented quirk)
- Date format in response is `YYYY-MM-DD` (not ISO timestamp)
- Results show one record per day per attendance type
- Use `id` field for regular attendance operations, `specialId` for special duty operations
- Use `holidayId` field when a date is marked as HOLIDAY
- Calendar shows comprehensive view including absences, holidays, and week-offs
- Only past and present dates are included (future dates not shown)

---

### 6. Get Attendance by ID
**Endpoint:** `GET /api/attendance/get-details/:attendanceId`

**Authentication:** Required (authMiddleware)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| attendanceId | Number | Yes | The ID of the attendance record to retrieve |

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/attendance/get-attendance/1" \
  -H "Cookie: accessToken=your-jwt-token"
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Attendance record retrieved successfully",
  "data": {
    "id": 1,
    "userId": "emp-001",
    "date": "2026-03-07T00:00:00.000Z",
    "checkInTime": "2026-03-07T08:30:15.000Z",
    "checkInLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
    "checkInPhoto": "s3-key-path/checkin.jpg",
    "checkOutTime": "2026-03-07T18:45:30.000Z",
    "checkOutLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
    "checkOutPhoto": "s3-key-path/checkout.jpg",
    "status": "PRESENT",
    "extraTime": 130,
    "checkoutOutside": false,
    "photos": {
      "s3-key-path/checkin.jpg": "https://presigned-url-for-checkin",
      "s3-key-path/checkout.jpg": "https://presigned-url-for-checkout"
    }
  }
}
```

**Response (Failure - 404):**
```json
{
  "success": false,
  "message": "Attendance record not found"
}
```

**Response (Failure - 401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Business Rules:**
1. Returns a single regular attendance record by ID
2. User can only retrieve their own attendance records
3. Record includes both check-in and check-out details if completed
4. Presigned URLs are generated for all photos for secure access

**Process:**
1. Validates attendanceId parameter
2. Fetches attendance record from database
3. Generates presigned URLs for photo access
4. Returns attendance record with all details and photo URLs

**Error Cases:**
- 404: Attendance record not found
- 401: Invalid/expired token
- 403: Attempting to access another user's record
- 500: Database error

---

### 8. Update Attendance (Admin Only)
**Endpoint:** `PUT /api/attendance/update/:attendanceId`

**Authentication:** Required (authMiddleware + adminMiddleware)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| attendanceId | Number | Yes | The ID of the attendance record to update |

**Request Body (JSON):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date | Date | No | Attendance date (ISO 8601 format) |
| checkInTime | Date | No | Check-in timestamp (ISO 8601 format) |
| checkOutTime | Date | No | Check-out timestamp (ISO 8601 format) |
| status | String | No | Attendance status (PRESENT, LATE, EARLY, OVERTIME) |
| extraTime | Number | No | Extra work hours in minutes |

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/attendance/update/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=your-jwt-token" \
  -d '{
    "status": "PRESENT",
    "extraTime": 120
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Attendance updated successfully",
  "data": {
    "id": 1,
    "userId": "emp-001",
    "date": "2026-03-07T00:00:00.000Z",
    "checkInTime": "2026-03-07T08:30:15.000Z",
    "checkInLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
    "checkInPhoto": "s3-key-path/checkin.jpg",
    "checkOutTime": "2026-03-07T18:45:30.000Z",
    "checkOutLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
    "checkOutPhoto": "s3-key-path/checkout.jpg",
    "status": "PRESENT",
    "extraTime": 120,
    "checkoutOutside": false
  }
}
```

**Response (Failure - 404):**
```json
{
  "success": false,
  "message": "Attendance record not found"
}
```

**Response (Failure - 401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Business Rules:**
1. Only admin users can update attendance records
2. Partial updates are allowed (only send fields to be updated)
3. Used for admin corrections or manual adjustments

**Process:**
1. Validates admin authorization
2. Validates attendanceId parameter
3. Updates specified fields in the record
4. Returns updated record

**Error Cases:**
- 404: Attendance record not found
- 401: Invalid/expired token or insufficient permissions
- 500: Database error

---

### 9. Update Special Attendance (Admin Only)
**Endpoint:** `PUT /api/attendance/update-special/:attendanceId`

**Authentication:** Required (authMiddleware + adminMiddleware)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| attendanceId | Number | Yes | The ID of the special attendance record to update |

**Request Body (JSON):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date | Date | No | Attendance date (ISO 8601 format) |
| checkInTime | Date | No | Check-in timestamp (ISO 8601 format) |
| checkOutTime | Date | No | Check-out timestamp (ISO 8601 format) |
| workHours | String | No | Work hours in HH:MM format |

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/attendance/update-special/5 \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=your-jwt-token" \
  -d '{
    "workHours": "8:30"
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Special Duty Attendance updated successfully",
  "data": {
    "id": 5,
    "userId": "emp-001",
    "date": "2026-03-04T00:00:00.000Z",
    "checkInTime": "2026-03-04T09:00:00.000Z",
    "checkInLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
    "checkInPhoto": "s3-key-path/special-checkin.jpg",
    "checkOutTime": "2026-03-04T17:30:00.000Z",
    "checkOutLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
    "checkOutPhoto": "s3-key-path/special-checkout.jpg",
    "workHours": "8:30"
  }
}
```

**Response (Failure - 404):**
```json
{
  "success": false,
  "message": "Attendance record not found"
}
```

**Process:**
1. Validates admin authorization
2. Validates attendanceId parameter
3. Updates specified fields in the special attendance record
4. Returns updated record

**Error Cases:**
- 404: Special attendance record not found
- 401: Invalid/expired token or insufficient permissions
- 500: Database error

---

### 10. Delete Attendance Records in Bulk (Admin Only)
**Endpoint:** `DELETE /api/attendance/delete`

**Authentication:** Required (authMiddleware + adminMiddleware)

**Request Body (JSON):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| attendanceIds | Array<Number> | Yes | Array of attendance record IDs to delete |

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/attendance/delete \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=your-jwt-token" \
  -d '{
    "attendanceIds": [1, 2, 3]
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Attendance records deleted successfully"
}
```

**Response (Failure - 400):**
```json
{
  "success": false,
  "message": "attendanceIds must be a non-empty array"
}
```

**Response (Failure - 404):**
```json
{
  "success": false,
  "message": "One or more attendance records not found"
}
```

**Response (Failure - 401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Business Rules:**
1. Only admin users can delete attendance records
2. Requires non-empty array of valid IDs
3. Deletes all specified records in a single transaction

**Process:**
1. Validates admin authorization
2. Validates attendanceIds parameter (must be non-empty array)
3. Converts all IDs to integers
4. Deletes all matching records
5. Returns success message

**Error Cases:**
- 400: Empty or invalid attendanceIds array
- 404: One or more records not found
- 401: Invalid/expired token or insufficient permissions
- 500: Database error

---

### 11. Delete Special Attendance Records in Bulk (Admin Only)
**Endpoint:** `DELETE /api/attendance/delete-special`

**Authentication:** Required (authMiddleware + adminMiddleware)

**Request Body (JSON):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| attendanceIds | Array<Number> | Yes | Array of special attendance record IDs to delete |

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/attendance/delete-special \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=your-jwt-token" \
  -d '{
    "attendanceIds": [5, 6, 7]
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Special Attendance records deleted successfully"
}
```

**Response (Failure - 400):**
```json
{
  "success": false,
  "message": "attendanceIds must be a non-empty array"
}
```

**Response (Failure - 404):**
```json
{
  "success": false,
  "message": "One or more special attendance records not found"
}
```

**Response (Failure - 401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Business Rules:**
1. Only admin users can delete special attendance records
2. Requires non-empty array of valid IDs
3. Deletes all specified records in a single transaction

**Process:**
1. Validates admin authorization
2. Validates attendanceIds parameter (must be non-empty array)
3. Converts all IDs to integers
4. Deletes all matching special attendance records
5. Returns success message

**Error Cases:**
- 400: Empty or invalid attendanceIds array
- 404: One or more records not found
- 401: Invalid/expired token or insufficient permissions
- 500: Database error

---

### 12. Get Attendance by ID
**Endpoint:** `GET /api/attendance/get-special-details/:attendanceId`

**Authentication:** Required (authMiddleware)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| attendanceId | Number | Yes | The ID of the special attendance record to retrieve |

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/attendance/get-special-details/5" \
  -H "Cookie: accessToken=your-jwt-token"
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Special Attendance record retrieved successfully",
  "data": {
    "id": 5,
    "userId": "emp-001",
    "date": "2026-03-04T00:00:00.000Z",
    "checkInTime": "2026-03-04T09:00:00.000Z",
    "checkInLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
    "checkInPhoto": "s3-key-path/special-checkin.jpg",
    "checkOutTime": "2026-03-04T17:30:00.000Z",
    "checkOutLocation": "{\"lat\":28.6139,\"lng\":77.2090,\"address\":\"Delhi, India\"}",
    "checkOutPhoto": "s3-key-path/special-checkout.jpg",
    "workHours": "8:30",
    "photos": {
      "s3-key-path/special-checkin.jpg": "https://presigned-url-for-checkin",
      "s3-key-path/special-checkout.jpg": "https://presigned-url-for-checkout"
    }
  }
}
```

**Response (Failure - 404):**
```json
{
  "success": false,
  "message": "Special attendance record not found"
}
```

**Response (Failure - 401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Business Rules:**
1. Returns a single special attendance record by ID
2. User can only retrieve their own special attendance records
3. Record includes both check-in and check-out details if completed
4. Work hours are in `HH:MM` format
5. Presigned URLs are generated for all photos for secure access

**Process:**
1. Validates attendanceId parameter
2. Fetches special attendance record from database
3. Generates presigned URLs for photo access
4. Returns special attendance record with all details and photo URLs

**Error Cases:**
- 404: Special attendance record not found
- 401: Invalid/expired token
- 403: Attempting to access another user's record
- 500: Database error

---

## Request/Response Formats

### Image Upload Format
- **Supported Formats:** JPEG, PNG
- **Max File Size:** Depends on multer configuration (typically 5-10 MB)
- **Upload Method:** Multipart form data
- **Field Name:** `checkInImage` or `checkOutImage`

### Location Format
All location data is stored as stringified JSON:
```json
{
  "lat": 28.6139,
  "lng": 77.2090,
  "address": "Delhi, India"
}
```

### Response Format
All responses follow standard format:
```json
{
  "success": boolean,
  "message": "Description of operation result",
  "data": {},
  "timestamp": "ISO8601 timestamp (if applicable)"
}
```

---

## Error Codes

| HTTP Code | Scenario |
|-----------|----------|
| 200 | Successful GET or successful update operation |
| 201 | Successful resource creation (check-in/special check-in) |
| 400 | Bad request, missing/invalid parameters, business logic violation |
| 401 | Unauthorized, missing or invalid token |
| 403 | Forbidden, insufficient permissions |
| 404 | Resource not found |
| 500 | Internal server error |

---

## Security Considerations

1. **Authentication:** All endpoints require valid JWT token in cookies
2. **Authorization:** 
   - Employee operations (check-in/out, view own attendance) require only `authMiddleware`
   - Admin operations (view all, update, delete) require both `authMiddleware` and `adminMiddleware`
   - Users can only check in/out for their own userId
3. **Image Uploads:** 
   - Images are validated and uploaded to S3 with secure access
   - Presigned URLs are generated server-side for photo access (URLs expire after a set time)
   - S3 keys are never exposed directly to client
4. **Location Verification:** GPS coordinates are validated against allowed work locations
5. **Data Isolation:** 
   - Users can only retrieve their own attendance records
   - Admin operations have full access to all employee records
6. **Presigned URL Security:** 
   - URLs are temporary and expire automatically
   - Photos are never exposed via direct S3 URLs
   - Prevents unauthorized access to stored photos

---

## Utilities & Helpers

### Date/Time Functions
Located in `src/utils/dateFormat.js`:
- `getStartOfDay(date)`: Returns start of day (00:00:00)
- `getEndOfDay(date)`: Returns end of day (23:59:59)
- `getAttendanceStatus(shift)`: Determines status based on shift timing
- `extraTime(checkIn, checkOut, shift, isHoliday, weekendOff)`: Calculates overtime
- `getUserShiftTimeInMinutes(shift)`: Extracts shift duration in minutes
- `isTodayWeekOff(weekendOff)`: Checks if today is a week-off day

### Storage Service
Located in `src/services/storage.service.js`:
- `uploadFile(buffer, filename, mimetype)`: Uploads file to S3, returns key path

### Validation
Located in `src/validators/attendance.validators.js`:
- Request body validation for attendance operations
- Location and image format validation

---

## Examples

### Complete Check-In Workflow
```bash
# 1. Check-in with image
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: multipart/form-data" \
  -H "Cookie: accessToken=YOUR_JWT_TOKEN" \
  -F "checkInImage=@checkin.jpg" \
  -F "lat=28.6139" \
  -F "lng=77.2090" \
  -F "address=Delhi Office"

# 2. Check-out with image (later in day)
curl -X POST http://localhost:3000/api/attendance/check-out \
  -H "Content-Type: multipart/form-data" \
  -H "Cookie: accessToken=YOUR_JWT_TOKEN" \
  -F "checkOutImage=@checkout.jpg" \
  -F "lat=28.6139" \
  -F "lng=77.2090" \
  -F "address=Delhi Office"

# 3. View calendar for the month
curl -X GET "http://localhost:3000/api/attendance/calender?userId=emp-001&month=3&year=2026" \
  -H "Cookie: accessToken=YOUR_JWT_TOKEN"

# 4. Get details of a specific attendance record
curl -X GET "http://localhost:3000/api/attendance/get-details/1" \
  -H "Cookie: accessToken=YOUR_JWT_TOKEN"

# 5. Get details with presigned URLs for photos
# The response includes a "photos" object with presigned URLs for secure photo access
```

### Complete Special Duty Workflow
```bash
# 1. Special duty check-in
curl -X POST http://localhost:3000/api/attendance/special-check-in \
  -H "Content-Type: multipart/form-data" \
  -H "Cookie: accessToken=YOUR_JWT_TOKEN" \
  -F "checkInImage=@checkin.jpg" \
  -F "lat=28.6139" \
  -F "lng=77.2090"

# 2. Special duty check-out
curl -X POST http://localhost:3000/api/attendance/special-check-out \
  -H "Content-Type: multipart/form-data" \
  -H "Cookie: accessToken=YOUR_JWT_TOKEN" \
  -F "checkOutImage=@checkout.jpg" \
  -F "lat=28.6139" \
  -F "lng=77.2090"

# 3. Get details of a specific special attendance record
curl -X GET "http://localhost:3000/api/attendance/get-special-details/5" \
  -H "Cookie: accessToken=YOUR_JWT_TOKEN"
```

### Admin Operations Examples

```bash
# 1. Get all attendance records with pagination and filters
curl -X GET "http://localhost:3000/api/attendance/?page=1&limit=20&userId=emp-001&startDate=2026-03-01&endDate=2026-03-31" \
  -H "Cookie: accessToken=ADMIN_JWT_TOKEN"

# 2. Update an attendance record (admin correction)
curl -X PUT http://localhost:3000/api/attendance/update/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=ADMIN_JWT_TOKEN" \
  -d '{
    "status": "PRESENT",
    "extraTime": 120
  }'

# 3. Update special attendance record
curl -X PUT http://localhost:3000/api/attendance/update-special/5 \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=ADMIN_JWT_TOKEN" \
  -d '{
    "workHours": "8:30"
  }'

# 4. Delete attendance records in bulk
curl -X DELETE http://localhost:3000/api/attendance/delete \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=ADMIN_JWT_TOKEN" \
  -d '{
    "attendanceIds": [1, 2, 3]
  }'

# 5. Delete special attendance records in bulk
curl -X DELETE http://localhost:3000/api/attendance/delete-special \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=ADMIN_JWT_TOKEN" \
  -d '{
    "attendanceIds": [5, 6, 7]
  }'
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "You are not within the allowed check-in location" | GPS coordinates outside allowed work location | Submit check-in from allowed location or contact admin to update location |
| "You have already checked in today" | User already has active attendance | Complete check-out before new check-in |
| "Cannot checkout from a check-in that was more than 24 hours ago" | Checkout attempted after 24-hour window | Checkout within 24 hours of check-in |
| "Check-in image is required" | No image file provided in upload | Attach image file to request |
| "Invalid/expired token" | Token missing or expired | Re-authenticate and obtain new token |
| S3 upload failure | Storage service error | Check S3 credentials and network connectivity |

