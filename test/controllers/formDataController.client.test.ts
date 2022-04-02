import { Application, NextFunction, Request, Response } from "express";
import request from "supertest";
import bootstrap from "../../src/config/bootstrap";
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
    attemptRefresh: function (req: Request, res: Response, next: NextFunction) {
      next();
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
    const registeredAdmin = await db.grabOne("admins");
    expect(registeredAdmin).toBeDefined();

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
