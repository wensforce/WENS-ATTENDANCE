import { body, param, validationResult } from "express-validator";
import { responses } from "../utils/response.js";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responses.badRequest(res, errors.array()[0].msg);
  }
  next();
};

export const createBreakConfigValidationRules = () => {
  return [
    // breakType Dont contain spaces ad Uppercase
    body("breakType")
      .notEmpty()
      .withMessage("Break type is required")
      .custom((value) => {
        if (value.includes(" ")) {
          throw new Error("Break type cannot contain spaces");
        }
        if (value !== value.toUpperCase()) {
          throw new Error("Break type must be in uppercase");
        }
        return true;
      }),
    body("label").notEmpty().withMessage("Label is required"),
    body("maxDurationMins").notEmpty().withMessage("Max duration is required"),
    body("maxPerDay").notEmpty().withMessage("Max per day is required"),
    body("isPaid").notEmpty().withMessage("Is paid is required"),
    body("isActive").notEmpty().withMessage("Is active is required"),
    body("graceMins").notEmpty().withMessage("Grace mins is required"),
    body("scope").notEmpty().withMessage("Scope is required"),
    body("applicableRoles")
      .optional()
      .isArray()
      .withMessage("Applicable roles must be an array"),
    body("userIds")
      .optional()
      .isArray()
      .withMessage("User IDs must be an array"),
    validate,
  ];
};

export const updateBreakConfigValidationRules = () => {
  return [
    param("id").notEmpty().withMessage("ID is required"),
    body("breakType")
      .optional()
      .custom((value) => {
        if (value.includes(" ")) {
          throw new Error("Break type cannot contain spaces");
        }
        if (value !== value.toUpperCase()) {
          throw new Error("Break type must be in uppercase");
        }
        if (value.trim() === "") {
          throw new Error("Break type cannot be empty");
        }
        return true;
      }),
    body("label").optional().notEmpty().withMessage("Label is required"),
    body("maxDurationMins").optional().notEmpty().withMessage("Max duration is required"),
    body("maxPerDay").optional().notEmpty().withMessage("Max per day is required"),
    body("isPaid").optional().notEmpty().withMessage("Is paid is required"),
    body("isActive").optional().notEmpty().withMessage("Is active is required"),
    body("graceMins").optional().notEmpty().withMessage("Grace mins is required"),
    body("scope").optional().notEmpty().withMessage("Scope is required"),
    body("applicableRoles").optional().isArray().withMessage("Applicable roles must be an array"),
    body("userIds").optional().isArray().withMessage("User IDs must be an array"),
    validate,
  ];
};

export const getIdValidationRules = () => {
  return [
    param("id").notEmpty().withMessage("ID is required"),
    validate,
  ];
};

export const getBreakAccessValidationRules = () => {
  return [
    param("userId").notEmpty().withMessage("User ID is required"),
    validate,
  ];
};

export const setOrUpdateBreakAccessValidationRules = () => {
  return [
    param("userId").notEmpty().withMessage("User ID is required"),
    body("breakConfigId").notEmpty().withMessage("Break config ID is required"),
    body("isAllowed").notEmpty().withMessage("Is allowed is required"),
    validate,
  ];
};