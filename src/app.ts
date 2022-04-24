import { Application } from "express";
import bootstrap from "./config/bootstrap";
import connectToDB from "./config/db";
import { PORT, REDIS_CLIENT, TRANSPORTER } from "./config/keys.env";

(async () => {
  // Database
  await connectToDB();

  // Redis
  REDIS_CLIENT.on("error", err => console.error("Cache Error", err));
  await REDIS_CLIENT.connect();
  console.log("Cache connected!");

  // Application configuration
  const app: Application = bootstrap("prod");

  // Email
  TRANSPORTER.verify(err => {
    if (err) console.error(err);
    else console.log("Email service verified!");
  });

  // Launch server
  app.listen(PORT, () => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`📡 Local server up! 📡 Listening on http://localhost:${PORT}`);
    } else {
      console.log("📡📡📡 Production server is live! 📡📡📡");
    }
  });
})();
