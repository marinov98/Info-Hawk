import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { DB_URL_TEST } from "../src/config/keys.env";

export default class dbTester {
  private mongoServer: any = null;
  private uri: string = DB_URL_TEST;
  private local: boolean;

  constructor(local: boolean = false, uri: string = DB_URL_TEST) {
    this.local = local;
    if (this.local) {
      this.uri = uri;
    }
  }

  public async connectTestDB() {
    try {
      if (!this.local) {
        this.mongoServer = await MongoMemoryServer.create();
        this.uri = this.mongoServer.getUri();
      }
      await mongoose.connect(this.uri);
    } catch (err) {
      console.error(err);
    }
  }

  public async clearDB() {
    try {
      const collections = mongoose.connection.collections;
      for (const collection in collections) {
        if (await collections[collection].findOne()) {
          await mongoose.connection.db.dropCollection(collection);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  public async closeDB() {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
      if (!this.local) await this.mongoServer.stop();
    } catch (err) {
      console.error(err);
    }
  }
}
