import mongoose from "mongoose";
import { DB_URL } from "./keys.env";

export default async function connectToDB(): Promise<void> {
  try {
    await mongoose.connect(DB_URL);
    console.log("Database connection successful!");
  } catch (err) {
    console.error(err);
  }
}
