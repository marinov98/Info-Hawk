import { Application, NextFunction, Request, Response } from "express";
import request from "supertest";
import bootstrap from "../../src/config/bootstrap";
import { CREATED, OK } from "../../src/config/keys.error";
import { TokenType } from "../../src/db/schemas/tokenSchema";
import dbTester from "../db";
import { ADMIN_MOCK } from "./adminController.mock";
import { FORM_MOCK } from "./formData.mock";

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

jest.mock("redis", () => ({
  createClient: function () {
    return {
      setEx(key: string, exp: number, val: string) {
        return null;
      },
      del(key: string) {
        return null;
      }
    };
  }
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

    const accessToken = (await db.grabOne("tokens", { type: TokenType.VERIFY })) as any;
    const res = await request(app).get(`/auth/verify/${accessToken.value}`);
    expect(res.status).toBe(302);
    registeredAdmin = await db.grabOne("admins");

    if (registeredAdmin) {
      code = registeredAdmin.code;
    }
    expect(code).toBeDefined();
    expect(code.length).toBe(10);

    const form = { ...FORM_MOCK };
    form.code = code;
    const { body, status: statusCode } = await request(app)
      .post("/auth/forms/create")
      .send({ form });
    expect(body.msg).toBeDefined();
    expect(statusCode).toBe(CREATED);
  });

  afterEach(async () => {
    await db.clearDB();
  });

  afterAll(async () => {
    await db.closeDB();
  });

  it("should format for xml successfully", async () => {
    const testStr = `{"_id":"6260b2f295fb67cb515518f6","First_^_Name":"Merlin","Last_^_Name":"The Great ","Favorite_^_TV-Show":"Merlin","Favorite_^_Song":"I got the magic in me","Favorite_^_Movie":"Excalibur","title":"Favorites","isSkeleton":false,"adminId":"6249fe7d8c24b22701da3a52","createdAt":"2022-04-21T01:27:14.007Z","updatedAt":"2022-04-21T01:27:14.007Z","__v":0}`;
    const { body, status } = await request(app)
      .post("/auth/forms/xml/single")
      .send({ jsonStr: testStr });

    expect(body.output).toBeDefined();
    expect(status).toBe(OK);

    expect(body.output[0]["createdAt"]).toBeDefined();
    expect(body.output[0]._id).toBeDefined();
    expect(body.output[0]["updatedAt"]).toBe(undefined);
    expect(body.output[0]["isSkeleton"]).toBe(undefined);
    expect(body.output[0]["First Name"]).toBe("Merlin");
  });

  it("should format for xml unsuccessfully", async () => {
    const testStr = "{}";
    const { body, status } = await request(app)
      .post("/auth/forms/xml/single")
      .send({ jsonStr: testStr });

    expect(status).toBe(OK);
    expect(body.output).toBeDefined();
    expect(body.output[0]).toBeDefined();
    expect(body.output[0]).toBeDefined();
    expect(body.output[0]["createdAt"]).toBeDefined();
    expect(body.output[0]._id).toBe(undefined);
  });
});
