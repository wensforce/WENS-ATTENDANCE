
import { body, validationResult } from "express-validator";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const checkInValidationRules = () => {
  return [
    // body("checkInLocation").notEmpty().withMessage("Check-in location is required"),
    file("checkInImage").custom((value, { req }) => {
      if (!req.file) {
        throw new Error("Check-in image is required");
      }
      return true;
    }),
    validate,
  ];
}

export const checkOutValidationRules = () => {
  return [
    body("checkOutLocation").notEmpty().withMessage("Check-out location is required"),
    file("checkOutImage").custom((value, { req }) => {
      if (!req.file) {
        throw new Error("Check-out image is required");
      }
      return true;
    }),
    validate,
  ];
}