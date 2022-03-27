import cookieParser from "cookie-parser";
import express, { Application } from "express";
import path from "path";
import { fillAuth } from "../middleware/authMiddleware";
import { adminRoutes, homeRoutes, resetRoutes } from "../routes";
import connectToDB from "./db";
import { cookieSecret, port } from "./keys.env";

export default async function bootstrap(): Promise<Application> {
  // Initialization
  const server: Application = express();
  server.set("port", port);

  // Middleware
  server.use(express.static(path.resolve(__dirname, "../public")));
  server.use(express.json());
  server.use(cookieParser(cookieSecret));

  // View Engine
  server.set("views", path.resolve(__dirname, "../views"));
  server.set("view engine", "ejs");

  // Database
  await connectToDB();

  server.get("*", fillAuth);
  server.use(homeRoutes);
  server.use(adminRoutes);
  server.use(resetRoutes);

  return server;
}
