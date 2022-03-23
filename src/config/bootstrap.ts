import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import { fillAuth } from "../middleware/authMiddleware";
import { adminRoutes } from "../routes";
import connectToDB from "./db";
import { cookieSecret, port } from "./keys.env";

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

  app.get("*", fillAuth);
  app.use(adminRoutes);

  return app;
}
