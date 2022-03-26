import { NextFunction, Request, Response } from "express";
import bootstrap from "./config/bootstrap";
import { port } from "./config/keys.env";
import { GOOD } from "./config/keys.error";

(async () => {
  const app = await bootstrap();

  // healthcheck
  app.get("/healthcheck", (_: Request, res: Response, __: NextFunction) => {
    return res.status(GOOD).send({ status: "healthy" });
  });

  // home
  app.get("/", (_: Request, res: Response, __: NextFunction) => res.render("home"));

  // Launch server
  app.listen(port, () => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`📡 Local server up! 📡 Listening on http://localhost:${port}`);
    } else {
      console.log("📡📡📡 Production server up and running! 📡📡📡");
    }
  });
})();