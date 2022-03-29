import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { DB_URL_TEST } from "../src/config/keys.env";

export default class dbTester {
  mongoServer: any = null;
  uri: string = DB_URL_TEST;
  local: boolean;

  constructor(local: boolean = false, uri: string = DB_URL_TEST) {
    this.local = local;
    if (this.local) {
      this.uri = uri;
    }
  }

  async connectTestDB() {
    if (!this.local) {
      this.mongoServer = await MongoMemoryServer.create();
      this.uri = this.mongoServer.getUri();
    }
    await mongoose.connect(this.uri);
  }

  async closeDB() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (!this.local) await this.mongoServer.stop();
  }

  async clearDB() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await mongoose.connection.db.dropCollection(key);
    }
  }
}
