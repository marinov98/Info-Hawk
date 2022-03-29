import mongoose from "mongoose";
import { DB_URL } from "./keys.env";

export default async function connectToDB(): Promise<void> {
  try {
    await mongoose.connect(DB_URL);
    if (DB_URL.includes("localhost")) {
      console.log("Local database connected! ");
    } else {
      console.log("Database connection successful!");
    }
  } catch (err) {
    console.error(err);
  }
}
