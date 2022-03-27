import { Application } from "express";
import request from "supertest";
import bootstrap from "../../src/config/bootstrap";
import { CREATED } from "../../src/config/keys.error";
import { clearDB, closeDB, connectTestDB } from "./../db";
import { ADMIN_MOCK, REGISTER_CONTROLLER_SUCCESS } from "./adminController.mock";

describe("Testing Admin Controller", () => {
  const app: Application = bootstrap();

  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  test("should register successfully", async () => {
    const admin = ADMIN_MOCK as any;
    admin.confirmPassword = ADMIN_MOCK.password;
    const res = await request(app).post("/register").send(ADMIN_MOCK);
    expect(res.body).toStrictEqual(REGISTER_CONTROLLER_SUCCESS);
    expect(res.status).toBe(CREATED);
  });
});
