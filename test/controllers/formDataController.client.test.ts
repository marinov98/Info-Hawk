import { Application, NextFunction, Request, Response } from "express";
import { sign } from "jsonwebtoken";
import request from "supertest";
import bootstrap from "../../src/config/bootstrap";
import { audience, issuer, JWT_SECRET } from "../../src/config/keys.env";
import { CREATED } from "../../src/config/keys.error";
import dbTester from "../db";
import { ADMIN_MOCK } from "./adminController.mock";

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
    attemptRefresh: function (req: Request, res: Response) {
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

describe("Testing Form Controller", () => {
  const app: Application = bootstrap();
  const db = new dbTester();
  let code: string = "";

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
    let registeredAdmin = (await db.grabOne("admins")) as any;
    expect(registeredAdmin).toBeDefined();
    expect(registeredAdmin.code.length).toBe(2);

    const accessToken: string = sign({ email: admin.email }, JWT_SECRET, {
      audience,
      issuer,
      expiresIn: "2m"
    });

    const res = await request(app).get(`/auth/verify/${accessToken}`);
    expect(res.status).toBe(302);
    registeredAdmin = await db.grabOne("admins");

    if (registeredAdmin) {
      code = registeredAdmin.code;
    }
    expect(code).toBeDefined();
    expect(code.length).toBe(10);
  });

  afterEach(async () => {
    await db.clearDB();
  });

  afterAll(async () => {
    await db.closeDB();
  });
});
