import { config } from "dotenv";
import nodemailer from "nodemailer";

if (process.env.NODE_ENV !== "production") {
  const { error } = config();

  if (error) throw error;
  console.log("Dotenv configured successfully");
}

const PORT_DEFAULT: number = 8081;
const port: number = parseInt(process.env.PORT!) || PORT_DEFAULT;
const jwtSecret: string = process.env.JWT_SECRET || "supersupersecret";
const jwtRefreshSecret: string = process.env.REFRESH_SECRET || "supersuperrefreshsecret";
const cookieSecret: string = process.env.COOKIE_SECRET || "supercookiesecret";
const issuer: string = process.env.ISSUER || "fake issuer";
const audience: string = process.env.AUDIENCE || "fake audience";
const dbUrlLocal = "mongodb://localhost:27017/info-hawk-store";
const dbUrlTest = process.env.TEST_DB_URL || "mongodb://localhost:27017/test-info-hawk";
const dbUrl: string = process.env.DB_URL || dbUrlLocal;
const appEmail = process.env.EMAIL_USERNAME || "example@gmail.com";
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: appEmail,
    pass: process.env.EMAIL_PASS
  },
  secure: process.env.NODE_ENV === "production"
});

export {
  port,
  cookieSecret,
  jwtSecret,
  jwtRefreshSecret,
  issuer,
  audience,
  dbUrl,
  dbUrlTest,
  transporter,
  appEmail
};
