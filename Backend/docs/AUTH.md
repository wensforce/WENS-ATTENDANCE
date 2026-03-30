# Authentication Documentation

## Overview
The authentication module provides user login, token management, and session handling for the Attendance Management System. It uses JWT tokens with HTTP-only cookies for secure session management.

---

## Authentication Flow

### 1. Login Process
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",      // Optional (either email or mobileNumber required)
  "mobileNumber": "+1234567890",    // Optional (either email or mobileNumber required)
  "pin": "1234"                      // Required, minimum 4 characters
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "userId": "user-id",
      "email": "user@example.com",
      "mobileNumber": "+1234567890"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "jwt-token"
    }
  }
}
```

**Response (Failure - 401):**
```json
{
  "success": false,
  "message": "Invalid email or mobile number" // or "Invalid PIN"
}
```

**Security Features:**
- PIN is validated using bcrypt hashing
- Refresh token is stored in the database for revocation control
- Both tokens are set as HTTP-only cookies
- Cookies have `secure` flag in production (HTTPS only)
- SameSite policy set to "strict" to prevent CSRF attacks

**Cookie Configuration:**
| Cookie | Max Age | Purpose |
|--------|---------|---------|
| accessToken | 15 minutes | Short-lived token for API requests |
| refreshToken | 7 days | Long-lived token for obtaining new accessTokens |

---

### 2. Token Refresh Process
**Endpoint:** `POST /api/auth/refresh-token`

**Request:** No body required (refreshToken sent via cookie)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "user": {
      "userId": "user-id",
      "email": "user@example.com",
      "mobileNumber": "+1234567890",
      "userType": "EMPLOYEE"
    },
    "tokens": {
      "accessToken": "new-jwt-token",
      "refreshToken": "new-jwt-token"
    }
  }
}
```

**Response (Failure - 401):**
```json
{
  "success": false,
  "message": "Invalid refresh token"
}
```

**Process:**
1. Retrieves refreshToken from HTTP-only cookie
2. Verifies token signature and expiration
3. Validates token exists in database for the user
4. Generates new access and refresh tokens
5. Updates database with new refresh token
6. Sets new tokens in HTTP-only cookies

---

### 3. Logout Process
**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required (authMiddleware)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Process:**
1. Requires valid accessToken from authMiddleware
2. Retrieves userId from authenticated request
3. Clears refreshToken in database (invalidates all refresh tokens)
4. Clears both accessToken and refreshToken cookies
5. User session is terminated

---

### 4. Get Logged-In User Info
**Endpoint:** `GET /api/auth/me`

**Authentication:** Required (authMiddleware)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logged-in user retrieved successfully",
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "mobileNumber": "+1234567890",
    "userType": "EMPLOYEE"
  },
  "timestamp": "2026-03-06T10:30:00.000Z"
}
```

**Response (Failure - 404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Middleware

### authMiddleware
**File:** `src/middleware/auth.middleware.js`

**Purpose:** Protects routes by verifying JWT token and attaching user info to request

**Process:**
1. Extracts accessToken from HTTP-only cookie or Authorization header
2. Verifies token signature and expiration using `verifyAccessToken()`
3. Validates user still exists in database
4. Attaches user object to `req.user` with:
   - `userId`
   - `email`
   - `userType`
   - `mobileNumber`
5. Calls `next()` to continue to route handler

**Error Cases:**
- Missing token → 401 Unauthorized
- Invalid/expired token → 401 Unauthorized
- User not found → 401 Unauthorized

**Usage in Routes:**
```javascript
router.get("/me", authMiddleware, authController.loggedInUser);
```

### adminMiddleware
**File:** `src/middleware/auth.middleware.js`

**Purpose:** Restricts routes to admin users only

**Process:**
1. Checks if `req.user.userType === "ADMIN"`
2. If not admin, returns 403 Forbidden error
3. Otherwise, calls `next()` to continue

**Usage in Routes:**
```javascript
router.get("/admin/dashboard", authMiddleware, adminMiddleware, adminController.getDashboard);
```

---

## Validation

### Login Validation Rules
**File:** `src/validators/auth.validator.js`

**Rules:**
| Field | Rule | Message |
|-------|------|---------|
| email | Optional, must be valid email format | "Invalid email format" |
| mobileNumber | Optional, must be valid mobile format | "Invalid mobile number format" |
| pin | Required, minimum 4 characters | "PIN must be at least 4 characters long" |
| email or mobileNumber | At least one required | "Either email or mobile number is required" |

**Applied on:** POST `/api/auth/login`

---

## Token Structure

### JWT Payload
Both access and refresh tokens contain:
```json
{
  "userId": "user-id",
  "email": "user@example.com",
  "mobileNumber": "+1234567890",
  "userType": "ADMIN" // or "EMPLOYEE"
}
```

### Token Verification
- Tokens use HS256 algorithm (HMAC with SHA-256)
- Secret key stored in environment variable
- Signature verified on every token usage
- Expiration claims checked automatically

---

## Security Considerations

### Best Practices Implemented
✅ **HTTP-Only Cookies:** Prevents XSS attacks from accessing tokens
✅ **Secure Flag:** Cookies only sent over HTTPS in production
✅ **SameSite Policy:** Prevents CSRF attacks by restricting cross-site cookie sending
✅ **Token Expiration:** Access tokens expire in 15 minutes, refresh tokens in 7 days
✅ **PIN Hashing:** User PINs hashed with bcrypt before storage
✅ **Database Validation:** Refresh tokens validated against database for revocation

### Potential Vulnerabilities & Mitigations
| Vulnerability | Mitigation |
|---|---|
| Token Theft | Short-lived access tokens, secure refresh flow |
| Brute Force Attacks | Implement rate limiting on login endpoint |
| Credential Interception | Use HTTPS/TLS in production |
| Session Hijacking | SameSite cookies, secure token validation |
| Token Reuse | Refresh tokens invalidated on logout |

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Refresh token is required"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid email or mobile number"
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
  "message": "User not found"
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

## Database Schema

### User Table - Auth Related Fields
```sql
- id (PRIMARY KEY)
- email (UNIQUE)
- mobileNumber (UNIQUE)
- pin (hashed with bcrypt)
- refreshToken (nullable, used for token revocation)
- userType (ADMIN or EMPLOYEE)
```

---

## Environment Variables
Required environment variables for authentication:
```bash
REFRESH_TOKEN_SECRET=your-refresh-token-secret
ACCESS_TOKEN_SECRET=your-access-token-secret
NODE_ENV=production  # or development
```

---

## Testing Authentication

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "pin": "1234"
  }' \
  -c cookies.txt
```

**Get Current User:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt
```

**Refresh Token:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -b cookies.txt
```

**Logout:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

---

## File References
- **Controller:** `src/controllers/auth.controller.js`
- **Routes:** `src/routes/auth.routes.js`
- **Middleware:** `src/middleware/auth.middleware.js`
- **Validators:** `src/validators/auth.validator.js`
- **Utilities:** `src/utils/token.js`

