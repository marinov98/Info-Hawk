import { Application } from "express";
import bootstrap from "./config/bootstrap";
import { port } from "./config/keys.env";

(async () => {
  const app: Application = await bootstrap();

  // Launch server
  app.listen(port, () => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`📡 Local server up! 📡 Listening on http://localhost:${port}`);
    } else {
      console.log("📡📡📡 Production server up and running! 📡📡📡");
    }
  });
})();
