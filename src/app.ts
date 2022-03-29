import { Application } from "express";
import bootstrap from "./config/bootstrap";
import connectToDB from "./config/db";
import { PORT } from "./config/keys.env";

(async () => {
  const app: Application = bootstrap();
  await connectToDB();

  // Launch server
  app.listen(PORT, () => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`📡 Local server up! 📡 Listening on http://localhost:${PORT}`);
    } else {
      console.log("📡📡📡 Production server up and running! 📡📡📡");
    }
  });
})();
