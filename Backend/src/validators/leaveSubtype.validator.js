import { param,body, validationResult } from "express-validator";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};


export const createLeaveSubtypeValidationRules = () => {
    return [
        body("name").notEmpty().withMessage("Name is required"),
        body("type").notEmpty().withMessage("Type is required"),
        validate,
    ];
};

export const updateLeaveSubtypeValidationRules = () => {
    return [
        param("id").isInt().withMessage("ID must be an integer"),
        body("name").notEmpty().withMessage("Name is required"),
        body("type").notEmpty().withMessage("Type is required"),
        validate,
    ];
};