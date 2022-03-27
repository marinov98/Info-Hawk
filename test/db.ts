import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { dbUrlTest } from "../src/config/keys.env";

export default class dbTester {
  mongoServer: any = null;
  uri: string = dbUrlTest;

  async connectTestDB(local: boolean = false) {
    if (!local) {
      this.mongoServer = await MongoMemoryServer.create();
      this.uri = this.mongoServer.getUri();
    }
    await mongoose.connect(this.uri);
  }

  async closeDB() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await this.mongoServer.stop();
  }

  async clearDB() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await mongoose.connection.db.dropCollection(key);
    }
  }
}
