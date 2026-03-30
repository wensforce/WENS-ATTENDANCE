import jwt from "jsonwebtoken";

/**
 * Generate Access Token (short-lived)
 * @param {Object} payload - User data to encode in token
 * @returns {string} - JWT access token
 */
export const generateAccessToken = (payload) => {
  const secret = process.env.JWT_ACCESS_SECRET || "your_access_secret_key";
  const expiresIn = process.env.JWT_ACCESS_EXPIRY || "15m";

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Generate Refresh Token (long-lived)
 * @param {Object} payload - User data to encode in token
 * @returns {string} - JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET || "your_refresh_secret_key";
  const expiresIn = process.env.JWT_REFRESH_EXPIRY || "7d";

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Generate both Access and Refresh Tokens
 * @param {Object} payload - User data to encode in tokens
 * @returns {Object} - { accessToken, refreshToken }
 */
export const generateTokens = (payload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify Access Token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  const secret = process.env.JWT_ACCESS_SECRET || "your_access_secret_key";
  return jwt.verify(token, secret);
};

/**
 * Verify Refresh Token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET || "your_refresh_secret_key";
  return jwt.verify(token, secret);
};
