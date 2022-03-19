import express, { application } from "express";
import cookieParser from "cookie-parser";
import { cookieSecret, port } from "./keys";
import connectToDB from "./db";

export default async function bootstrap() {
  // initialization
  const app = express();
  app.set("port", port);

  // Middleware
  app.use(express.static("../public"));
  app.use(express.json());
  app.use(cookieParser(cookieSecret));

  // View Engine
  app.set("view engine", "ejs");

  // Database
  await connectToDB();

  return app;
}
