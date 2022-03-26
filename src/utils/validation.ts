import joi from "joi";

const authObj = {
  email: joi
    .string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "edu"] } })
    .required(),
  password: joi.string().min(3).max(30).required()
};

export const registrationSchema = joi
  .object({
    firstName: joi.string().min(1).max(30).required(),
    lastName: joi.string().min(1).max(30).required(),
    email: authObj.email,
    password: authObj.password,
    confirmPassword: joi.ref("password")
  })
  .with("password", "confirmPassword");

export const loginSchema = joi.object(authObj);
