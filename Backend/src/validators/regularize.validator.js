import { body, param, query, validationResult } from "express-validator";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const createRegularizeValidationRules = () => [
  body("date").isISO8601().withMessage("Date must be a valid date"),
  body("checkInTime")
    .isISO8601()
    .withMessage("Check-in time must be a valid date"),
  body("checkOutTime")
    .isISO8601()
    .withMessage("Check-out time must be a valid date")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.checkInTime)) {
        throw new Error("Check-out time must be after check-in time");
      }
      return true;
    }),
  body("reason")
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Reason must be between 5 and 500 characters"),
  validate,
];

export const listRegularizeValidationRules = () => [
  query("status")
    .optional()
    .isIn(["PENDING", "APPROVED", "REJECTED"])
    .withMessage("Status must be PENDING, APPROVED, or REJECTED"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("month")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("Month must be between 1 and 12"),
  query("year").optional().isInt({ min: 1900 }).withMessage("Year must be a valid integer"),
  query("userId").optional().isInt({ min: 1 }).withMessage("User ID must be an integer"),
  validate,
];

export const idParamValidationRules = () => [
  param("id").isInt({ min: 1 }).withMessage("ID must be an integer"),
  validate,
];

export const approveRegularizeValidationRules = () => [
  param("id").isInt({ min: 1 }).withMessage("ID must be an integer"),
  body("checkInTime")
    .optional()
    .isISO8601()
    .withMessage("Check-in time must be a valid date"),
  body("checkOutTime")
    .optional()
    .isISO8601()
    .withMessage("Check-out time must be a valid date"),
  body("adminNote")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Admin note must be at most 500 characters"),
  validate,
];

export const rejectRegularizeValidationRules = () => [
  param("id").isInt({ min: 1 }).withMessage("ID must be an integer"),
  body("adminNote")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Admin note must be at most 500 characters"),
  validate,
];
