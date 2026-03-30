import { body, param, query, validationResult } from "express-validator";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const createLeaveAndHolidayValidationRules = () => {
  return [
    body("status")
      .isIn(["LEAVE", "HOLIDAY"])
      .withMessage("Status must be either LEAVE or HOLIDAY"),
    body("startDate")
      .isISO8601()
      .toDate()
      .withMessage("Start date must be a valid date"),
    body("endDate")
      .isISO8601()
      .toDate()
      .withMessage("End date must be a valid date")
      .custom((value, { req }) => {
        if (new Date(value) < new Date(req.body.startDate)) {
          throw new Error("End date must be after start date");
        }
        return true;
      }),
    body("reason").optional().isString().withMessage("Reason must be a string"),
    body("employeeIds")
      .isArray({ min: 1 })
      .withMessage("Employee IDs must be an array with at least one ID")
      .custom((value) => {
        if (!value.every((id) => Number.isInteger(id))) {
          throw new Error("All employee IDs must be integers");
        }
        return true;
      }),
    validate,
  ];
};

export const updateLeaveAndHolidayValidationRules = () => {
  return [
    body("status")
      .isIn(["LEAVE", "HOLIDAY"])
      .withMessage("Status must be either LEAVE or HOLIDAY"),
    body("startDate")
      .isISO8601()
      .toDate()
      .withMessage("Start date must be a valid date"),
    body("endDate")
      .isISO8601()
      .toDate()
      .withMessage("End date must be a valid date")
      .custom((value, { req }) => {
        if (new Date(value) < new Date(req.body.startDate)) {
          throw new Error("End date must be after start date");
        }
        return true;
      }),
    body("reason").optional().isString().withMessage("Reason must be a string"),
    body("employeeIds")
      .isArray({ min: 1 })
      .withMessage("Employee IDs must be an array with at least one ID")
      .custom((value) => {
        if (!value.every((id) => Number.isInteger(id))) {
          throw new Error("All employee IDs must be integers");
        }
        return true;
      }),
    validate,
  ];
};

export const deleteLeaveAndHolidayValidationRules = () => {
  return [param("id").isInt().withMessage("ID must be an integer"), validate];
};

export const getLeavesAndHolidaysByDateValidationRules = () => {
  return [
    query("date")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Date must be a valid date"),
    query("month")
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage("Month must be an integer between 1 and 12"),
    query("year")
      .optional()
      .isInt({ min: 1900 })
      .withMessage("Year must be a valid integer"),
    query("startDate")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Start date must be a valid date"),
    query("endDate")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("End date must be a valid date"),
    query().custom((value, { req }) => {
      if (
        !value.date &&
        !value.month &&
        !value.year &&
        !value.startDate &&
        !value.endDate
      ) {
        throw new Error(
          "At least one of date, month, year, startDate, or endDate is required",
        );
      } else if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) {
        throw new Error("Both startDate and endDate must be provided together");
      } else if (value.startDate && value.endDate && new Date(value.endDate) < new Date(value.startDate)) {
        throw new Error("endDate must be after startDate");
      } else if (value.month && !value.year) {
        throw new Error("Year must be provided when month is provided");
      }
      return true;
    }),
    validate,
  ];
};
