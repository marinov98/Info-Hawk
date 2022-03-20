import express from "express";
import cookieParser from "cookie-parser";
import { cookieSecret, port } from "./keys.env";
import connectToDB from "./db";
import { adminRoutes } from "./../routes/index";
import path from "path";

export default async function bootstrap() {
  // Initialization
  const app = express();
  app.set("port", port);

  // Middleware
  app.use(express.static(path.resolve(__dirname, "../public")));
  app.use(express.json());
  app.use(cookieParser(cookieSecret));

  // View Engine
  app.set("views", path.resolve(__dirname, "../views"));
  app.set("view engine", "ejs");

  // Database
  await connectToDB();

  // Routes
  app.use(adminRoutes);

  return app;
}
