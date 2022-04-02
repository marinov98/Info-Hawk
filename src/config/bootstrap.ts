import cookieParser from "cookie-parser";
import express, { Application } from "express";
import { resolve } from "path";
import { fillAuth, monitorCookies } from "../middleware/authMiddleware";
import * as routes from "../routes";
import { COOKIE_SECRET, PORT } from "./keys.env";

export default function bootstrap(): Application {
  // Initialization
  const server: Application = express();
  server.set("port", PORT);

  // Middleware
  server.use(express.static(resolve(__dirname, "../public")));
  server.use(express.json());
  server.use(cookieParser(COOKIE_SECRET));

  // View Engine
  server.set("views", resolve(__dirname, "../views"));
  server.set("view engine", "ejs");

  server.use(monitorCookies);
  server.get("*", fillAuth);
  Object.values(routes).forEach(route => server.use(route));

  return server;
}
