import { config } from "dotenv";

if (process.env.NODE_ENV !== "production") {
  const { error } = config();

  if (error) throw error;
}

const PORT_DEFAULT: number = 8081;
const port: number = parseInt(process.env.PORT!) || PORT_DEFAULT;
const secret: string = process.env.SECRET || "supersupersecret";
const issuer: string = process.env.ISSUER || "fake issuer";
const audience: string = process.env.AUDIENCE || "fake audience";

export { port, secret, issuer, audience };
