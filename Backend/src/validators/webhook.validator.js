import { body, param, validationResult } from "express-validator";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const events = ["check_in", "check_out", "leave_added", "user_registered"];

export const webhookValidation = [
  body("url")
    .trim()
    .notEmpty()
    .withMessage("Webhook URL is required")
    .isURL()
    .withMessage("Invalid webhook URL format"),

  body("event")
    .trim()
    .notEmpty()
    .withMessage("Webhook event is required")
    .isIn(events)
    .withMessage(`Invalid event type. Must be one of: ${events.join(", ")}`),

  validate,
];

