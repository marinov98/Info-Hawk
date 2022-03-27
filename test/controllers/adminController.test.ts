import { Application } from "express";
import request from "supertest";
import bootstrap from "../../src/config/bootstrap";
import { CREATED } from "../../src/config/keys.error";
import * as db from "./../db";
import { ADMIN_MOCK } from "./admin.mock";

describe("Testing Admin Controller", () => {
  const app: Application = bootstrap();

  beforeAll(async () => {
    await db.connectTestDB();
  });

  afterEach(async () => {
    await db.clearDB();
  });

  afterAll(async () => {
    await db.closeDB();
  });

  test("should register successfully", async () => {
    const admin = ADMIN_MOCK as any;
    admin.confirmPassword = ADMIN_MOCK.password;
    const res = await request(app).post("/register").send(ADMIN_MOCK);
    expect(res.body).toStrictEqual({ created: true });
    expect(res.status).toBe(CREATED);
  });
});
