import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import express, { Application } from "express";
import session from "express-session";
import { resolve } from "path";
import { fillAuth, monitorCookies } from "../middleware/authMiddleware";
import * as routes from "../routes";
import { COOKIE_SECRET, DB_URL, PORT } from "./keys.env";

declare module "express-session" {
  export interface SessionData {
    submission: { [key: string]: any } | null;
  }
}

export default function bootstrap(): Application {
  // Initialization
  const server: Application = express();
  server.set("port", PORT);

  // Middleware
  server.use(express.static(resolve(__dirname, "../public")));
  server.use(express.json());
  server.use(cookieParser(COOKIE_SECRET));

  // Session
  server.use(
    session({
      secret: COOKIE_SECRET,
      resave: true,
      saveUninitialized: true,
      store: MongoStore.create({ mongoUrl: DB_URL }),
      cookie: { maxAge: 60 * 1000 * 60 * 3 }
    })
  );

  // View Engine
  server.set("views", resolve(__dirname, "../views"));
  server.set("view engine", "ejs");

  server.use(monitorCookies);
  server.get("*", fillAuth);
  Object.values(routes).forEach(route => server.use(route));

  return server;
}
