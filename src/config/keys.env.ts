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
const DB_URL_LOCAL: string = "mongodb://localhost:27017/info-hawk-store";
const DB_URL_TEST: string = process.env.TEST_DB_URL || "mongodb://localhost:27017/test-info-hawk";
const DB_URL: string = process.env.DB_URL || DB_URL_LOCAL;
const BCRYPT_SALT: number = parseInt(process.env.HASH!) || 12;
const EMAIL_PORT: number = parseInt(process.env.EMAIL_PORT!) || 400;
const EMAIL_HOST: string = process.env.EMAIL_HOST || "smtp.example.com";
const EMAIL_SECURITY: boolean = process.env.EMAIL_SECURITY ? true : false;
const APP_EMAIL: string = process.env.EMAIL_USERNAME || "example@gmail.com";
const PROTOCAL: string = process.env.NODE_ENV === "production" ? "https" : "http";
const TRANSPORTER = nodemailer.createTransport({
  host: EMAIL_HOST,
  secure: EMAIL_SECURITY,
  port: EMAIL_PORT,
  tls: {
    ciphers: "SSLv3"
  },
  auth: {
    user: APP_EMAIL,
    pass: process.env.EMAIL_PASS
  }
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
  BCRYPT_SALT,
  PROTOCAL
};
