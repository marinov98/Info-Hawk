import { config } from "dotenv";

if (process.env.NODE_ENV !== "production") {
  const { error } = config();

  if (error) throw error;
}

const PORT_DEFAULT: number = 8081;
const port: number = parseInt(process.env.PORT!) || PORT_DEFAULT;
const jwtSecret: string = process.env.SECRET || "supersupersecret";
const cookieSecret: string = process.env.COOKIE_SECRET || "supercookiesecret";
const issuer: string = process.env.ISSUER || "fake issuer";
const audience: string = process.env.AUDIENCE || "fake audience";
const dbUrl: string = process.env.DB_URL || "mongodb://localhost:27017/tax-holdings";

export { port, cookieSecret, jwtSecret, issuer, audience, dbUrl };
