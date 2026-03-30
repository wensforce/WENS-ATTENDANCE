import { body,param, validationResult } from "express-validator";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const registerValidationRules = () => {
  return [
    body("email").isEmail().withMessage("Invalid email format"),
    body("mobileNumber")
      .isMobilePhone()
      .withMessage("Invalid mobile number format"),
    body("employeeId").notEmpty().withMessage("Employee ID is required"),
    body("departmentId").notEmpty().withMessage("Department is required"),
    body("designationId").notEmpty().withMessage("Designation is required"),
    body("shift").notEmpty().withMessage("Shift is required"),
    validate,
  ];
};

export const updateValidationRules = () => {
  return [
    param("id").isInt().withMessage("Invalid employee ID"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("mobileNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Invalid mobile number format"),
    body("employeeId").optional().notEmpty().withMessage("Employee ID is required"),
    body("department").optional().notEmpty().withMessage("Department is required"),
    body("designation").optional().notEmpty().withMessage("Designation is required"),
    body("shift").optional().notEmpty().withMessage("Shift is required"),
    validate,
  ];
};

export const deleteValidationRules = () => {
  return [
    param("id").isInt().withMessage("Invalid employee ID"), 
    validate
  ];
}

export const getByIdValidationRules = () => {
  return [
    param("id").isInt().withMessage("Invalid employee ID"), 
    validate
  ];
}

export const resetPinValidationRules = () => {
  return [
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("mobileNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Invalid mobile number format"),
    body().custom((value, { req }) => {
      if (!req.body.email && !req.body.mobileNumber) {
        throw new Error("Either email or mobile number is required");
      }
      return true;
    }),
    validate,
  ];
};