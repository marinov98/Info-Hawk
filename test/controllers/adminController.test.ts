import { Application, NextFunction, Request, Response } from "express";
import request from "supertest";
import bootstrap from "../../src/config/bootstrap";
import {
  BAD_REQUEST,
  CREATED,
  LOGIN_ERR_MSG,
  NOT_FOUND,
  NOT_SAME_EMAIL_ERR,
  OK,
  SAME_EMAIL_ERR
} from "../../src/config/keys.error";
import { TokenType } from "../../src/db/schemas/tokenSchema";
import dbTester from "./../db";
import { ADMIN_MOCK, REGISTER_CONTROLLER_SUCCESS } from "./adminController.mock";

jest.mock("./../../src/middleware/authMiddleware", () => {
  return {
    authenticateAdmin: function (req: Request, res: Response, next: NextFunction) {
      next();
    },
    maintainAuth: function (req: Request, res: Response, next: NextFunction) {
      next();
    },
    fillAuth: function (req: Request, res: Response, next: NextFunction) {
      next();
    },
    attemptRefresh: function (req: Request, res: Response, next: NextFunction) {
      return;
    },
    monitorCookies: function (req: Request, res: Response, next: NextFunction) {
      next();
    }
  };
});

jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: async function (options: any) {
      return Promise.resolve({
        messageId: "123",
        success: true
      });
    }
  })
}));

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
    expect(status).toBe(OK);
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

  it("should verify admin successfully", async () => {
    let user = (await db.grabOne("admins")) as any;
    expect(user).toBeDefined();
    let token = (await db.grabOne("tokens", { owner: user._id.toString() })) as any;
    expect(token.value).toBeDefined();
    expect(token.type).toBe(TokenType.VERIFY);
    if (user) expect(user.code).toBe("NA");
    const { status } = await request(app).get(`/auth/verify/${token.value}`);
    expect(status).toBe(302);
    user = await db.grabOne("admins");
    expect(user).toBeDefined();
    if (user) expect(user.code.length).toBe(10);
    token = await db.grabOne("tokens", { value: token.value });
    expect(token).toBe(null);
  });

  it("should resend verification link successfully", async () => {
    const { body, status } = await request(app)
      .post("/auth/resend")
      .send({ email: ADMIN_MOCK.email });
    expect(body.message).toBeDefined();
    expect(body.messageId).toBeDefined();
    expect(body.message).toBe("Link resent!");
    expect(body.messageId).toBe("123");
    expect(status).toBe(OK);
  });

  it("should resend verification link unsuccessfully email not found", async () => {
    const { body } = await request(app).post("/auth/resend").send({ email: "fake@gmail.com" });
    expect(body.hawkError).toBeDefined();
    expect(body.hawkError.msg).toBe(NOT_SAME_EMAIL_ERR);
    expect(body.hawkError.status).toBe(NOT_FOUND);
  });

  it("should delete user account successfully", async () => {
    let user = (await db.grabOne("admins")) as any;
    expect(user._id).toBeDefined;
    const id = user._id.toString();
    const { body, status } = await request(app).delete("/auth/account/delete").send({ id });
    expect(body.msg).toBe("Account deleted successfully!");
    expect(status).toBe(OK);
    user = await db.grabOne("admins");
    expect(user).toBe(null);
    const token = await db.grabOne("tokens", { owner: id });
    expect(token).toBe(null);
  });
});
