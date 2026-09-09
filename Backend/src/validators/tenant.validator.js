import { body, param, validationResult } from "express-validator";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const tenantStatuses = ["active", "inactive"];

export const createTenantValidation = [
  body("name").trim().notEmpty().withMessage("Tenant name is required"),
  body("slug")
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be lowercase letters, numbers, and hyphens"),
  body("status")
    .optional()
    .isIn(tenantStatuses)
    .withMessage(`Status must be one of: ${tenantStatuses.join(", ")}`),
  body("admin.employeeName")
    .trim()
    .notEmpty()
    .withMessage("Admin name is required"),
  body("admin.email").isEmail().withMessage("Valid admin email is required"),
  body("admin.mobileNumber")
    .trim()
    .notEmpty()
    .withMessage("Admin mobile number is required"),
  body("admin.employeeId").optional().trim(),
  body("bodyguardEnabled")
    .optional()
    .isBoolean()
    .withMessage("bodyguardEnabled must be true or false"),
  validate,
];

export const updateTenantValidation = [
  param("id").isInt().withMessage("Invalid tenant ID"),
  body("name").optional().trim().notEmpty().withMessage("Tenant name is required"),
  body("slug")
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be lowercase letters, numbers, and hyphens"),
  body("status")
    .optional()
    .isIn(tenantStatuses)
    .withMessage(`Status must be one of: ${tenantStatuses.join(", ")}`),
  body("bodyguardEnabled")
    .optional()
    .isBoolean()
    .withMessage("bodyguardEnabled must be true or false"),
  validate,
];

export const tenantIdParamValidation = [
  param("id").isInt().withMessage("Invalid tenant ID"),
  validate,
];
