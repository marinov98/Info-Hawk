import cookieParser from "cookie-parser";
import express, { Application } from "express";
import path from "path";
import { fillAuth } from "../middleware/authMiddleware";
import * as routes from "../routes";
import { COOKIE_SECRET, PORT } from "./keys.env";

export default function bootstrap(): Application {
  // Initialization
  const server: Application = express();
  server.set("port", PORT);

  // Middleware
  server.use(express.static(path.resolve(__dirname, "../public")));
  server.use(express.json());
  server.use(cookieParser(COOKIE_SECRET));

  // View Engine
  server.set("views", path.resolve(__dirname, "../views"));
  server.set("view engine", "ejs");

  server.get("*", fillAuth);
  Object.entries(routes).forEach(([, route]) => {
    server.use(route);
  });

  return server;
}
