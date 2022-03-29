import { config } from "dotenv";
import nodemailer from "nodemailer";

if (process.env.NODE_ENV !== "production") {
  const { error } = config();

  if (error) console.info("Dotenv was not detected");
  else console.info("Dotenv configured successfully");
}

const PORT_DEFAULT: number = 8081;
const PORT: number = parseInt(process.env.PORT!) || PORT_DEFAULT;
const JWT_SECRET: string = process.env.JWT_SECRET || "supersupersecret";
const JWT_REFRESH_SECRET: string = process.env.REFRESH_SECRET || "supersuperrefreshsecret";
const COOKIE_SECRET: string = process.env.COOKIE_SECRET || "supercookiesecret";
const issuer: string = process.env.ISSUER || "fake issuer";
const audience: string = process.env.AUDIENCE || "fake audience";
const DB_URL_LOCAL = "mongodb://localhost:27017/info-hawk-store";
const DB_URL_TEST = process.env.TEST_DB_URL || "mongodb://localhost:27017/test-info-hawk";
const DB_URL: string = process.env.DB_URL || DB_URL_LOCAL;
const BCRYPT_SALT: number = parseInt(process.env.HASH!) || 12;
const APP_EMAIL = process.env.EMAIL_USERNAME || "example@gmail.com";
const TRANSPORTER = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: APP_EMAIL,
    pass: process.env.EMAIL_PASS
  },
  secure: process.env.NODE_ENV === "production"
});

export {
  PORT,
  COOKIE_SECRET,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  issuer,
  audience,
  DB_URL,
  DB_URL_TEST,
  TRANSPORTER,
  APP_EMAIL,
  BCRYPT_SALT
};
