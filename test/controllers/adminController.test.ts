import mongoose from "mongoose";

describe("Testing Admin Controller", () => {
  afterAll(done => {
    mongoose.connection.close();
    done();
  });

  it("should register successfully", async () => {});
});
