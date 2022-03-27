import mongoose from "mongoose";
import { dbUrlTest } from "../src/config/keys.env";

export async function connectTestDB() {
  await mongoose.connect(dbUrlTest);
}

export async function closeDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await mongoose.connection.db.dropCollection(key);
  }
}
