import { Application, NextFunction, Request, Response } from "express";
import { sign } from "jsonwebtoken";
import request from "supertest";
import bootstrap from "../../src/config/bootstrap";
import { audience, issuer, JWT_SECRET } from "../../src/config/keys.env";
import { BAD_REQUEST, CREATED, FORM_CREATE_ERR, NOT_FOUND } from "../../src/config/keys.error";
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

  it("should create form successfully", async () => {
    const form = { ...FORM_MOCK };
    form.code = code;
    const { body, status } = await request(app).post("/auth/forms/create").send({ form });
    expect(body.msg).toBeDefined();
    expect(status).toBe(CREATED);
  });

  it("should create form unsuccessfully code too short", async () => {
    const form = { ...FORM_MOCK };
    form.code = "tooshort";
    const { body, status } = await request(app).post("/auth/forms/create").send({ form });
    expect(body.hawkError).toBeDefined();
    expect(body.hawkError.src).toBe("infoDataMiddleware");
    expect(status).toBe(BAD_REQUEST);
  });

  it("should create form unsuccessfully other attributes not boolean", async () => {
    const form = { ...FORM_MOCK } as any;
    form.code = code;
    form.fake = "not wanted";
    const { body, status } = await request(app).post("/auth/forms/create").send({ form });
    expect(body.hawkError).toBeDefined();
    expect(body.hawkError.src).toBe("infoDataMiddleware");
    expect(status).toBe(BAD_REQUEST);
  });

  it("should create form unsuccessfully code too long", async () => {
    const form = { ...FORM_MOCK };
    form.code = "tooshort;lkajsdf;lkjasd;flkjas;ldkfj;alskdjf;lkasdjfa;sldkfj";
    const { body, status } = await request(app).post("/auth/forms/create").send({ form });
    expect(body.hawkError).toBeDefined();
    expect(body.hawkError.src).toBe("infoDataMiddleware");
    expect(status).toBe(BAD_REQUEST);
  });

  it("should create form unsuccessfully code not string", async () => {
    const form = { ...FORM_MOCK };
    form.code = true as any;
    const { body, status } = await request(app).post("/auth/forms/create").send({ form });
    expect(body.hawkError).toBeDefined();
    expect(body.hawkError.src).toBe("infoDataMiddleware");
    expect(status).toBe(BAD_REQUEST);
  });

  it("should create form unsuccessfully key not boolean", async () => {
    const form = { ...FORM_MOCK } as any;
    form.code = code;
    form.SSN = "1234";
    const { body, status } = await request(app).post("/auth/forms/create").send({ form });
    expect(body.hawkError).toBeDefined();
    expect(body.hawkError.src).toBe("infoDataMiddleware");
    expect(status).toBe(BAD_REQUEST);
  });

  it("should create form unsuccessfully title not string", async () => {
    const form = { ...FORM_MOCK };
    form.title = true as any;
    form.code = code;
    const { body, status } = await request(app).post("/auth/forms/create").send({ form });
    expect(body.hawkError).toBeDefined();
    expect(body.hawkError.src).toBe("infoDataMiddleware");
    expect(status).toBe(BAD_REQUEST);
  });

  it("should create form unsuccessfully request body invalid", async () => {
    const form = { ...FORM_MOCK };
    form.title = true as any;
    form.code = code;
    const { body, status } = await request(app).post("/auth/forms/create").send({ form: null });
    expect(body.hawkError).toBeDefined();
    expect(body.hawkError.src).toBe("infoDataMiddleware");
    expect(body.hawkError.msg).toBe("required data not found!");
    expect(status).toBe(BAD_REQUEST);
  });

  it("should create form unsuccessfully code invalid", async () => {
    const form = { ...FORM_MOCK };
    form.code = "invalidcod";
    const { body, status } = await request(app).post("/auth/forms/create").send({ form });
    expect(body.hawkError).toBeDefined();
    expect(body.hawkError.src).toBe("InfoDataController");
    expect(body.hawkError.msg).toBe(FORM_CREATE_ERR);
    expect(status).toBe(NOT_FOUND);
  });

  it("should create form unsuccessfully title used before", async () => {
    const form = { ...FORM_MOCK };
    form.code = code;
    const { body, status } = await request(app).post("/auth/forms/create").send({ form });
    expect(body.msg).toBeDefined();
    expect(status).toBe(CREATED);

    const seconForm = { ...FORM_MOCK };
    seconForm.code = code;
    const { body: body2, status: status2 } = await request(app)
      .post("/auth/forms/create")
      .send({ form: seconForm });
    expect(body2.hawkError).toBeDefined();
    expect(body2.hawkError.msg).toBe(FORM_CREATE_ERR);
    expect(status2).toBe(NOT_FOUND);
  });
});
