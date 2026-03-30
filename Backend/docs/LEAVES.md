# Leaves & Holidays API Documentation

## Overview
The Leaves & Holidays API manages company leaves and holidays for employees. It allows employees to view their current leaves/holidays and enables admins to create, update, and manage leaves and holidays across the organization.

---

## Access Control

| Endpoint | Permission | Role Required |
|----------|-----------|---------------|
| GET / | All authenticated users | Employee/Admin |
| GET /dates | All authenticated users | Employee/Admin |
| POST / | Admin only | Admin |
| PUT /:id | Admin only | Admin |
| DELETE /:id | Admin only | Admin |

**Authentication:** All endpoints require valid `accessToken` (authMiddleware)
**Admin Endpoints:** Require authMiddleware + adminMiddleware

---

## Endpoints

### 1. Get Current Leaves and Holidays
**Endpoint:** `GET /api/leaves/`

**Authentication:** Required (authMiddleware)

**Query Parameters:** None required

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Leaves and holidays fetched successfully",
  "data": [
    {
      "id": 1,
      "type": "LEAVE",
      "startDate": "2026-03-10T00:00:00.000Z",
      "endDate": "2026-03-15T00:00:00.000Z",
      "reason": "Annual leave",
      "employees": [
        {
          "employeeId": "emp-1",
          "leaveId": 1
        }
      ]
    },
    {
      "id": 2,
      "type": "HOLIDAY",
      "startDate": "2026-03-08T00:00:00.000Z",
      "endDate": "2026-03-08T00:00:00.000Z",
      "reason": "Women's Day",
      "employees": []
    }
  ]
}
```

**Purpose:** Returns all leaves and holidays that the authenticated user is part of and are currently active (between startDate and endDate, including today).

**Process:**
1. Gets current date at midnight
2. Fetches all leaves/holidays where:
   - User is included in the employees list, AND
   - Today's date falls between startDate and endDate (inclusive)
3. Returns matching leaves/holidays

**Error Cases:**
- 401 Unauthorized: Missing or invalid token
- 500 Internal Server Error: Database error

---

### 2. Get Leaves and Holidays by Date
**Endpoint:** `GET /api/leaves/dates`

**Authentication:** Required (authMiddleware)

**Query Parameters (at least one required):**
```
- date: ISO8601 date (e.g., 2026-03-06)
- month: Integer 1-12
- year: Integer >= 1900
- startDate: ISO8601 date (requires endDate)
- endDate: ISO8601 date (requires startDate)
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Leaves and holidays fetched successfully",
  "data": [
    {
      "id": 1,
      "type": "LEAVE",
      "startDate": "2026-03-10T00:00:00.000Z",
      "endDate": "2026-03-15T00:00:00.000Z",
      "reason": "Annual leave",
      "userId": "user-1"
    }
  ]
}
```

**Query Examples:**

**By Specific Date:**
```
GET /api/leaves/dates?date=2026-03-08
```
Returns all leaves/holidays that include this date.

**By Month and Year:**
```
GET /api/leaves/dates?month=3&year=2026
```
Returns all leaves/holidays that fall within March 2026.

**By Year Only:**
```
GET /api/leaves/dates?year=2026
```
Returns all leaves/holidays within the entire year 2026.

**By Date Range:**
```
GET /api/leaves/dates?startDate=2026-03-01&endDate=2026-03-31
```
Returns all leaves/holidays that fall within the specified date range.

**Validation Rules:**
| Parameter | Rules | Error Message |
|-----------|-------|---------------|
| date | Optional, must be valid ISO8601 date | "Date must be a valid date" |
| month | Optional, 1-12 | "Month must be an integer between 1 and 12" |
| year | Optional, >= 1900 | "Year must be a valid integer" |
| startDate | Optional, must be valid ISO8601 date | "Start date must be a valid date" |
| endDate | Optional, must be valid ISO8601 date | "End date must be a valid date" |
| At least one required | One of: date, month, year, startDate, or endDate | "At least one of date, month, year, startDate, or endDate is required" |
| startDate & endDate together | If one provided, both must be provided | "Both startDate and endDate must be provided together" |
| endDate > startDate | When date range is provided | "endDate must be after startDate" |
| month requires year | If month is provided, year must be provided | "Year must be provided when month is provided" |

**Error Cases:**
- 400 Bad Request: Invalid query parameters or missing required parameters
- 401 Unauthorized: Missing or invalid token
- 500 Internal Server Error: Database error

---

### 3. Create Leave or Holiday
**Endpoint:** `POST /api/leaves/`

**Authentication:** Required (authMiddleware + adminMiddleware)

**Request Body:**
```json
{
  "type": "LEAVE",
  "startDate": "2026-03-10",
  "endDate": "2026-03-15",
  "reason": "Annual leave",
  "employeeIds": [1, 2, 3]
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Leave or holiday created successfully",
  "data": {
    "id": 5,
    "type": "LEAVE",
    "startDate": "2026-03-10T00:00:00.000Z",
    "endDate": "2026-03-15T00:00:00.000Z",
    "reason": "Annual leave",
    "employees": [
      {
        "employeeId": 1,
        "leaveId": 5
      },
      {
        "employeeId": 2,
        "leaveId": 5
      },
      {
        "employeeId": 3,
        "leaveId": 5
      }
    ]
  }
}
```

**Validation Rules:**
| Field | Rules | Error Message |
|-------|-------|---------------|
| type | Required, must be "LEAVE" or "HOLIDAY" | "Type must be either LEAVE or HOLIDAY" |
| startDate | Required, valid ISO8601 date | "Start date must be a valid date" |
| endDate | Required, valid ISO8601 date, must be >= startDate | "End date must be a valid date" / "End date must be after start date" |
| reason | Optional, must be string | "Reason must be a string" |
| employeeIds | Required, array with min 1 element, all integers | "Employee IDs must be an array with at least one ID" / "All employee IDs must be integers" |

**Process:**
1. Validates all input fields
2. Creates new LeaveAndHoliday record with:
   - type
   - startDate
   - endDate
   - reason
3. Creates LeaveEmployee records for each employee ID
4. Returns created leave/holiday with employee associations

**Error Cases:**
- 400 Bad Request: Invalid input data
- 401 Unauthorized: Not authenticated
- 403 Forbidden: User is not admin
- 500 Internal Server Error: Database error

---

### 4. Update Leave or Holiday
**Endpoint:** `PUT /api/leaves/:id`

**Authentication:** Required (authMiddleware + adminMiddleware)

**URL Parameters:**
```
id: Integer (ID of the leave/holiday to update)
```

**Request Body:**
```json
{
  "type": "HOLIDAY",
  "startDate": "2026-03-15",
  "endDate": "2026-03-18",
  "reason": "Extended holiday",
  "employeeIds": [1, 4, 5]
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Leave or holiday updated successfully",
  "data": {
    "id": 5,
    "type": "HOLIDAY",
    "startDate": "2026-03-15T00:00:00.000Z",
    "endDate": "2026-03-18T00:00:00.000Z",
    "reason": "Extended holiday",
    "employees": [
      {
        "employeeId": 1,
        "leaveId": 5
      },
      {
        "employeeId": 4,
        "leaveId": 5
      },
      {
        "employeeId": 5,
        "leaveId": 5
      }
    ]
  }
}
```

**Validation Rules:** Same as Create (POST) endpoint

**Process:**
1. Validates URL parameter ID as integer
2. Validates all input fields
3. Updates LeaveAndHoliday record:
   - type
   - startDate
   - endDate
   - reason
4. Deletes all existing LeaveEmployee associations
5. Creates new LeaveEmployee records for updated employee list
6. Returns updated leave/holiday with new employee associations

**Error Cases:**
- 400 Bad Request: Invalid input data or malformed ID
- 401 Unauthorized: Not authenticated
- 403 Forbidden: User is not admin
- 500 Internal Server Error: Database error

---

### 5. Delete Leave or Holiday
**Endpoint:** `DELETE /api/leaves/:id`

**Authentication:** Required (authMiddleware + adminMiddleware)

**URL Parameters:**
```
id: Integer (ID of the leave/holiday to delete)
```

**Response (Success - 204):**
```
No Content
```

**Validation Rules:**
| Parameter | Rules | Error Message |
|-----------|-------|---------------|
| id | Required, must be integer | "ID must be an integer" |

**Process:**
1. Validates ID parameter as integer
2. Checks if leave/holiday exists
3. If not found, returns 404 error
4. Deletes all associated LeaveEmployee records
5. Deletes the LeaveAndHoliday record
6. Returns 204 No Content (success with no body)

**Error Cases:**
- 400 Bad Request: Malformed ID parameter
- 401 Unauthorized: Not authenticated
- 403 Forbidden: User is not admin
- 404 Not Found: Leave/holiday with given ID doesn't exist
- 500 Internal Server Error: Database error

---

## Database Schema

### LeaveAndHoliday Table
```sql
- id (PRIMARY KEY, AUTO INCREMENT)
- type (ENUM: 'LEAVE', 'HOLIDAY')
- startDate (DATE/TIMESTAMP)
- endDate (DATE/TIMESTAMP)
- reason (VARCHAR, nullable)
- createdAt (TIMESTAMP, auto)
- updatedAt (TIMESTAMP, auto)
```

### LeaveEmployee Junction Table
```sql
- id (PRIMARY KEY, AUTO INCREMENT)
- leaveId (FOREIGN KEY → LeaveAndHoliday.id)
- employeeId (FOREIGN KEY → User.id)
- createdAt (TIMESTAMP, auto)
- updatedAt (TIMESTAMP, auto)
```

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "msg": "Type must be either LEAVE or HOLIDAY",
      "param": "type",
      "location": "body"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Admin access required"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Leave or holiday not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Use Cases

### Employee Viewing Current Leaves
An employee wants to see if they are on leave today.

```bash
curl -X GET http://localhost:3000/api/leaves/ \
  -H "Cookie: accessToken=jwt-token"
```

### Admin Creating Company Holiday
Admin wants to create a company-wide holiday for Women's Day (March 8).

```bash
curl -X POST http://localhost:3000/api/leaves/ \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=jwt-token" \
  -d '{
    "type": "HOLIDAY",
    "startDate": "2026-03-08",
    "endDate": "2026-03-08",
    "reason": "Women\u0027s Day",
    "employeeIds": [1, 2, 3, 4, 5]
  }'
```

### Admin Creating Leave for Specific Employees
Admin wants to grant annual leave to employees 1 and 2.

```bash
curl -X POST http://localhost:3000/api/leaves/ \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=jwt-token" \
  -d '{
    "type": "LEAVE",
    "startDate": "2026-03-20",
    "endDate": "2026-03-25",
    "reason": "Annual leave",
    "employeeIds": [1, 2]
  }'
```

### Get Leaves in Specific Month
Employee wants to see all their leaves and holidays for March 2026.

```bash
curl -X GET "http://localhost:3000/api/leaves/dates?month=3&year=2026" \
  -H "Cookie: accessToken=jwt-token"
```

### Get Leaves in Date Range
Admin wants to see all leaves/holidays between March 1 and March 31.

```bash
curl -X GET "http://localhost:3000/api/leaves/dates?startDate=2026-03-01&endDate=2026-03-31" \
  -H "Cookie: accessToken=jwt-token"
```

### Update Existing Leave
Admin wants to extend a leave period.

```bash
curl -X PUT http://localhost:3000/api/leaves/5 \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=jwt-token" \
  -d '{
    "type": "LEAVE",
    "startDate": "2026-03-20",
    "endDate": "2026-03-28",
    "reason": "Extended annual leave",
    "employeeIds": [1, 2]
  }'
```

### Delete Leave
Admin wants to cancel a leave record.

```bash
curl -X DELETE http://localhost:3000/api/leaves/5 \
  -H "Cookie: accessToken=jwt-token"
```

---

## File References
- **Controller:** `src/controllers/leaves.controller.js`
- **Routes:** `src/routes/leaves.route.js`
- **Validators:** `src/validators/leaves.validator.js`
- **Middleware:** `src/middleware/auth.middleware.js`

---

## Notes

### Date Handling
- All dates are converted to JavaScript Date objects on validation
- Database stores dates in ISO8601 format
- When querying by date, use ISO8601 format: YYYY-MM-DD

### Employee Association
- Uses junction table (LeaveEmployee) for many-to-many relationship
- When updating, old associations are deleted and new ones are created
- This ensures consistency and prevents orphaned records

### Current Leave Detection
- "Current" leaves are determined by checking if today's date falls between startDate and endDate (inclusive)
- Time component is zeroed out to midnight for accurate day-level comparison

### Admin Access
- All create, update, and delete operations require admin role
- Employees can only view leaves/holidays using the GET endpoints
- Admin endpoints automatically verify user role via adminMiddleware

