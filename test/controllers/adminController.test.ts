import { Application } from "express";
import request from "supertest";
import bootstrap from "../../src/config/bootstrap";
import {
  BAD_REQUEST,
  CREATED,
  GOOD,
  LOGIN_ERR_MSG,
  SAME_EMAIL_ERR
} from "../../src/config/keys.error";
import dbTester from "./../db";
import { ADMIN_MOCK, REGISTER_CONTROLLER_SUCCESS } from "./adminController.mock";

describe("Testing Admin Controller", () => {
  const app: Application = bootstrap();
  const db = new dbTester();

  beforeAll(async () => {
    await db.connectTestDB();
  });

  beforeEach(async () => {
    const admin = {
      ...ADMIN_MOCK
    } as any;
    admin.confirmPassword = admin.password;
    const { status } = await request(app).post("/register").send(admin);
    expect(status).toBe(CREATED);
  });

  afterEach(async () => {
    await db.clearDB();
  });

  afterAll(async () => {
    await db.closeDB();
  });

  it("should register successfully", async () => {
    const admin = { ...ADMIN_MOCK } as any;
    admin.email = "secondSuccessful@gmail.com";
    admin.confirmPassword = ADMIN_MOCK.password;
    const { body, status } = await request(app).post("/register").send(admin);
    expect(body).toStrictEqual(REGISTER_CONTROLLER_SUCCESS);
    expect(status).toBe(CREATED);
  });

  it("should register unsuccessfully email exists", async () => {
    const admin = { ...ADMIN_MOCK } as any;
    admin.confirmPassword = admin.password;
    const { body, status } = await request(app).post("/register").send(admin);
    expect(status).toBe(BAD_REQUEST);
    expect(body.hawkError.msg).toBe(SAME_EMAIL_ERR);
  });

  it("should register unsuccessfully schema invalidates", async () => {
    const { body, status } = await request(app).post("/register").send(ADMIN_MOCK);
    expect(status).toBe(BAD_REQUEST);
    expect(body.hawkError.src).toBe("validationMiddleware");
  });

  it("should login successfully", async () => {
    const { email, password } = ADMIN_MOCK;
    const { body, status } = await request(app).post("/login").send({ email, password });
    expect(body).toHaveProperty("id");
    expect(status).toBe(GOOD);
  });

  it("should login unsuccessfully wrong email right password", async () => {
    let { email, password } = ADMIN_MOCK;
    email = "wrong@gmail.com";
    const { body, status } = await request(app).post("/login").send({ email, password });
    expect(body.hawkError.msg).toBe(LOGIN_ERR_MSG);
    expect(status).toBe(BAD_REQUEST);
  });

  it("should login unsuccessfully right email wrong password", async () => {
    let { email, password } = ADMIN_MOCK;
    password = "wrong";
    const { body, status } = await request(app).post("/login").send({ email, password });
    expect(body.hawkError.msg).toBe(LOGIN_ERR_MSG);
    expect(status).toBe(BAD_REQUEST);
  });

  it("should login unsuccessfully wrong email wrong password", async () => {
    let { email, password } = ADMIN_MOCK;
    password = "wrong";
    email = "wrong@gmail.com";
    const { body, status } = await request(app).post("/login").send({ email, password });
    expect(body.hawkError.msg).toBe(LOGIN_ERR_MSG);
    expect(status).toBe(BAD_REQUEST);
  });

  it("should login unsuccessfully schema invalidates email", async () => {
    let { email, password } = ADMIN_MOCK;
    email = "bob@gmail.fake";
    const { body, status } = await request(app).post("/login").send({ email, password });
    expect(body.hawkError.src).toBe("validationMiddleware");
    expect(body.hawkError.msg).toBe('"email" must be a valid email');
    expect(status).toBe(BAD_REQUEST);
  });

  it("should login unsuccessfully schema invalidates password too short", async () => {
    let { email, password } = ADMIN_MOCK;
    password = "p";
    const { body, status } = await request(app).post("/login").send({ email, password });
    expect(body.hawkError.src).toBe("validationMiddleware");
    expect(body.hawkError.msg).toBe('"password" length must be at least 3 characters long');
    expect(status).toBe(BAD_REQUEST);
  });

  it("should login unsuccessfully schema invalidates password too big", async () => {
    let { email, password } = ADMIN_MOCK;
    password = "pqweproiuqwretpoiuerwlkjahsdfglkjhasglkjhasdflkjhasdlfkjhasdflkjh";
    const { body, status } = await request(app).post("/login").send({ email, password });
    expect(body.hawkError.src).toBe("validationMiddleware");
    expect(body.hawkError.msg).toBe(
      '"password" length must be less than or equal to 36 characters long'
    );
    expect(status).toBe(BAD_REQUEST);
  });
});
