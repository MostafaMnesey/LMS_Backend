import Joi from "joi";
export const generalFeilds = {
  name: Joi.string().min(3).max(32).messages({
    "string.base": "First name must be a string",
    "string.empty": "First name cannot be empty",
    "string.min": "First name must be at least {#limit} characters",
    "string.max": "First name must be at most {#limit} characters",
    "any.required": "First name is required",
  }),
  email: Joi.string().email().messages({
    "string.base": "Email must be a string",
    "string.empty": "Email cannot be empty",
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&^#])[A-Za-z\\d@$!%*?&^#]{8,}$"
      )
    )
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password cannot be empty",
      "string.pattern.base":
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&^#)",
      "any.required": "Password is required",
    }),
  confirmPassword: Joi.any().valid(Joi.ref("password")).required().messages({
    "any.only": "Confirm password must match the password",
    "any.required": "Confirm password is required",
  }),
  gender: Joi.string().valid("male", "female").messages({
    "string.base": "Gender must be a string",
    "string.empty": "Gender cannot be empty",
    "any.only": "Gender must be either 'male' or 'female'",
    "any.required": "Gender is required",
  }),
  phone: Joi.string()
    .pattern(new RegExp("^(?:\\+20|0020|0)?1[0125][0-9]{8}$"))
    .messages({
      "string.base": "Phone number must be a string",
      "string.empty": "Phone number cannot be empty",
      "string.pattern.base":
        "Please enter a valid Egyptian phone number (e.g. 01012345678)",
      "any.required": "Phone number is required",
    }),
  idToken: Joi.string().messages({
    "string.base": "ID token must be a string",
    "string.empty": "ID token cannot be empty",
    "any.required": "ID token is required",
  }),
  provider: Joi.string().valid("google", "local").messages({
    "string.base": "Provider must be a string",
    "string.empty": "Provider cannot be empty",
    "any.only": "Provider must be either 'google' or 'local'",
    "any.required": "Provider is required",
  }),
  otp: Joi.string()
    .max(6)
    .min(6)
    .regex(/^[0-9]{6}$/)
    .messages({
      "string.base": "OTP must be a string",
      "string.empty": "OTP cannot be empty",
      "string.min": "OTP must be exactly {#limit} digits",
      "string.max": "OTP must be exactly {#limit} digits",
      "string.pattern.base": "OTP must contain only numbers",
      "any.required": "OTP is required",
    }),
  userId: Joi.string()
    .regex(/^c[a-z0-9]{20,32}$/)
    .required()
    .messages({
      "string.base": "User ID must be a string",
      "string.empty": "User ID cannot be empty",
      "string.pattern.base": "ID format is invalid, it must be a valid CUID",
      "any.required": "User ID is required",
    }),
  bio: Joi.string().min(16).max(300).messages({
    "string.base": "Bio must be a string",
    "string.empty": "Bio cannot be empty",
    "string.min": "Bio must be at least {#limit} characters",
    "string.max": "Bio must be at most {#limit} characters",
    "any.required": "Bio is required",
  }),
  search: Joi.string().max(32).messages({
    "string.base": "Search query must be a string",
    "string.empty": "Search query cannot be empty",
    "string.max": "Search query must be at most {#limit} characters",
    "any.required": "Search query is required",
  }),
  file: {
    fieldname: Joi.string().required().messages({
      "string.base": "File field name must be a string",
      "string.empty": "File field name cannot be empty",
      "any.required": "File field name is required",
    }),
    originalname: Joi.string().required().messages({
      "string.base": "Original file name must be a string",
      "string.empty": "Original file name cannot be empty",
      "any.required": "Original file name is required",
    }),
    encoding: Joi.string().required().messages({
      "string.base": "File encoding must be a string",
      "string.empty": "File encoding cannot be empty",
      "any.required": "File encoding is required",
    }),
    mimetype: Joi.string().required().messages({
      "string.base": "File MIME type must be a string",
      "string.empty": "File MIME type cannot be empty",
      "any.required": "File MIME type is required",
    }),
    finalPath: Joi.string().required().messages({
      "string.base": "File final path must be a string",
      "string.empty": "File final path cannot be empty",
      "any.required": "File final path is required",
    }),
    destination: Joi.string().required().messages({
      "string.base": "File destination must be a string",
      "string.empty": "File destination cannot be empty",
      "any.required": "File destination is required",
    }),
    filename: Joi.string().required().messages({
      "string.base": "Filename must be a string",
      "string.empty": "Filename cannot be empty",
      "any.required": "Filename is required",
    }),
    path: Joi.string().required().messages({
      "string.base": "File path must be a string",
      "string.empty": "File path cannot be empty",
      "any.required": "File path is required",
    }),
    size: Joi.number().positive().required().messages({
      "number.base": "File size must be a number",
      "number.positive": "File size must be a positive number",
      "any.required": "File size is required",
    }),
  },
  codeCountry: Joi.string().required().valid("+20", "+966").messages({
    "string.base": "Code country must be a string",
    "string.empty": "Code country cannot be empty",
    "any.only": "Code country must be either '+20' or '+966'",
    "any.required": "Code country is required",
  }),
};
