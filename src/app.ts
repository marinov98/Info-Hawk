import { Application } from "express";
import bootstrap from "./config/bootstrap";
import connectToDB from "./config/db";
import { PORT, REDIS_CLIENT, TRANSPORTER } from "./config/keys.env";

(async () => {
  // Redis
  REDIS_CLIENT.on("error", err => console.error("Redis Client Error", err));
  await REDIS_CLIENT.connect();
  console.log("Redis Client finished trying to connect");

  // Application configuration
  const app: Application = bootstrap();

  // Database
  await connectToDB();

  // Email
  TRANSPORTER.verify(err => {
    if (err) console.error(err);
    else console.log("Email service up and running!");
  });

  // Launch server
  app.listen(PORT, () => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`📡 Local server up! 📡 Listening on http://localhost:${PORT}`);
    } else {
      console.log("📡📡📡 Production server up and running! 📡📡📡");
    }
  });
})();
