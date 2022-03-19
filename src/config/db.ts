import mongoose from "mongoose";
import { dbUrl } from "./keys";

export default async function connectToDB(): Promise<void> {
  try {
    await mongoose.connect(dbUrl);
    if (dbUrl.includes("localhost")) {
      console.log("Local database connected! ");
    } else {
      console.log("Database connection successful!");
    }
  } catch (err) {
    console.error(err);
  }
}
