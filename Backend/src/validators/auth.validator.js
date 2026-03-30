import { body, validationResult } from "express-validator";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const loginValidationRules = () => {
  return [
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("mobileNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Invalid mobile number format"),
    body("pin")
      .isLength({ min: 4 })
      .withMessage("PIN must be at least 4 characters long"),
    body().custom((value, { req }) => {
      if (!req.body.email && !req.body.mobileNumber) {
        throw new Error("Either email or mobile number is required");
      }
      return true;
    }),
    validate,
  ];
};
