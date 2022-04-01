import { Application } from "express";
import { sign } from "jsonwebtoken";
import request from "supertest";
import bootstrap from "../../src/config/bootstrap";
import { audience, issuer, JWT_SECRET } from "../../src/config/keys.env";
import {
  BAD_REQUEST,
  CREATED,
  LOGIN_ERR_MSG,
  OK,
  TOKEN_RESET_ERR,
  TOKEN_RESET_PAYLOAD_ERR,
  UNAUTHORIZED
} from "../../src/config/keys.error";
import dbTester from "./../db";
import { ADMIN_MOCK } from "./adminController.mock";

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

describe("Testing Reset Controller", () => {
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
    const { body, status } = await request(app).post("/register").send(admin);
    expect(status).toBe(CREATED);
    expect(body.created).toBe(true);
  });

  afterEach(async () => {
    await db.clearDB();
  });

  afterAll(async () => {
    await db.closeDB();
  });

  it("should make all GET requests successfully", async () => {
    let res = await request(app).get("/error/token");
    expect(res.status).toBe(OK);
    res = await request(app).get("/passwordMail");
    expect(res.status).toBe(OK);
    res = await request(app).get("/passwordReset/;lkjasdf;lkja");
    expect(res.status).toBe(302);
  });

  it("should send resend link successfully", async () => {
    const { email } = ADMIN_MOCK;
    const { body, status } = await request(app).post("/passwordMail").send({ email });
    expect(status).toBe(OK);
    expect(body.message).toBe("A reset link was sent to your email");
    expect(body.messageId).toBe("123");
  });

  it("should send resend link unsuccessfully email does not exist", async () => {
    let { email } = ADMIN_MOCK;
    email = "bad@gmail.com";
    const { body, status } = await request(app).post("/passwordMail").send({ email });
    expect(status).toBe(BAD_REQUEST);
    expect(body.hawkError.msg).toBe("User with this email does not exist!");
  });

  it("should reset password successfully", async () => {
    const { email, password } = ADMIN_MOCK;
    const accessToken: string = sign({ email }, JWT_SECRET, { audience, issuer, expiresIn: "2m" });
    const newPassword = "newPass123";
    const { body, status } = await request(app).put(`/reset/${accessToken}`).send({ newPassword });
    expect(status).toBe(OK);
    expect(body.message).toBe("Password reset successfully!");
    expect(body.messageId).toBe("123");

    // login with old password (should fail)
    const {
      body: { hawkError }
    } = await request(app).post("/login").send({ email, password });
    expect(hawkError.msg).toBe(LOGIN_ERR_MSG);

    // login with new password (should succeed)
    const { body: body2, status: status2 } = await request(app)
      .post("/login")
      .send({ email, password: newPassword });
    expect(body2).toHaveProperty("id");
    expect(status2).toBe(OK);
  });

  it("should reset unsuccessfully bad token", async () => {
    const accessToken: string = "badktoken123";
    const newPassword = "newPass123";
    const { body, status } = await request(app).put(`/reset/${accessToken}`).send({ newPassword });
    expect(body.hawkError.msg).toBe(TOKEN_RESET_ERR);
    expect(status).toBe(UNAUTHORIZED);
  });

  it("should reset unsuccessfully bad issuer", async () => {
    const { email } = ADMIN_MOCK;
    const accessToken: string = sign({ email }, JWT_SECRET, {
      audience,
      issuer: "fake",
      expiresIn: "2m"
    });
    const newPassword = "newPass123";
    const { body, status } = await request(app).put(`/reset/${accessToken}`).send({ newPassword });
    expect(body.hawkError.msg).toBe(TOKEN_RESET_ERR);
    expect(status).toBe(UNAUTHORIZED);
  });

  it("should reset unsuccessfully bad audience", async () => {
    const { email } = ADMIN_MOCK;
    const accessToken: string = sign({ email }, JWT_SECRET, {
      audience: "fake",
      issuer,
      expiresIn: "2m"
    });
    const newPassword = "newPass123";
    const { body, status } = await request(app).put(`/reset/${accessToken}`).send({ newPassword });
    expect(body.hawkError.msg).toBe(TOKEN_RESET_ERR);
    expect(status).toBe(UNAUTHORIZED);
  });

  it("should reset unsuccessfully bad payload", async () => {
    let { email } = ADMIN_MOCK;
    email = "wrongwrong@gmail.com";
    const accessToken: string = sign({ email }, JWT_SECRET, {
      audience,
      issuer,
      expiresIn: "2m"
    });
    const newPassword = "newPass123";
    const { body, status } = await request(app).put(`/reset/${accessToken}`).send({ newPassword });
    expect(body.hawkError.msg).toBe("Data in token was not valid, request a new link");
    expect(status).toBe(UNAUTHORIZED);

    const accessToken2: string = sign({ id: email }, JWT_SECRET, {
      audience,
      issuer,
      expiresIn: "2m"
    });
    const {
      body: { hawkError }
    } = await request(app).put(`/reset/${accessToken2}`).send({ newPassword });
    expect(hawkError.msg).toBe(TOKEN_RESET_PAYLOAD_ERR);
    expect(hawkError.status).toBe(UNAUTHORIZED);
  });
});
