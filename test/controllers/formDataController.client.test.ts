import { Application, NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import request from "supertest";
import bootstrap from "../../src/config/bootstrap";
import {
  BAD_REQUEST,
  CREATED,
  FORM_EDIT_CODE_ERR,
  FORM_EDIT_DOC_ERR,
  NOT_FOUND,
  OK,
  UNKNOWN_ERR_MSG
} from "../../src/config/keys.error";
import { TokenType } from "../../src/db/schemas/tokenSchema";
import dbTester from "../db";
import { ADMIN_MOCK } from "./adminController.mock";
import { FORM_MOCK } from "./formData.mock";

jest.mock("./../../src/middleware/authMiddleware", () => {
  return {
    cookieGuard: function (req: Request, res: Response, next: NextFunction) {
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

  it("should allow client to submit form successfully", async () => {
    const client_submission = { ...FORM_MOCK } as any;
    client_submission.code = code;
    client_submission.SSN = { input: "123", inputType: "single" };
    client_submission.address = { input: "testing address", inputType: "single" };
    client_submission.lastName = { input: "faker", inputType: "single" };
    const { body, status } = await request(app)
      .post("/client/form-submission")
      .send({ form: client_submission });
    expect(status).toBe(CREATED);
    expect(body.msg).toBe("Submission successful!");
    expect(body.messageId).toBe("123");
  });

  it("should allow client to submit form unsuccessfully wrong code", async () => {
    const client_submission = { ...FORM_MOCK } as any;
    client_submission.code = "badcode123";
    client_submission.SSN = { input: "123", inputType: "single" };
    client_submission.address = { input: "testing address", inputType: "single" };
    client_submission.lastName = { input: "faker", inputType: "single" };
    const { body, status } = await request(app)
      .post("/client/form-submission")
      .send({ form: client_submission });
    expect(status).toBe(NOT_FOUND);
    expect(body.hawkError.msg).toBe(FORM_EDIT_CODE_ERR);
  });

  it("should allow client to submit form unsuccessfully form not found", async () => {
    const client_submission = { ...FORM_MOCK } as any;
    client_submission.title = "wrong title";
    client_submission.code = code;
    client_submission.SSN = { input: "123", inputType: "single" };
    client_submission.address = { input: "testing address", inputType: "single" };
    client_submission.lastName = { input: "faker", inputType: "single" };
    const { body, status } = await request(app)
      .post("/client/form-submission")
      .send({ form: client_submission });
    expect(status).toBe(NOT_FOUND);
    expect(body.hawkError.msg).toBe(FORM_EDIT_DOC_ERR);
  });

  it("should allow client to submit form unsuccessfully middleware fail on code", async () => {
    const client_submission = { ...FORM_MOCK } as any;
    client_submission.code = "badcode12";
    client_submission.SSN = "123";
    client_submission.address = "testing address";
    client_submission.lastName = "faker";
    const { body, status } = await request(app)
      .post("/client/form-submission")
      .send({ form: client_submission });
    expect(status).toBe(BAD_REQUEST);
    expect(body.hawkError.src).toBe("infoDataMiddleware");
  });

  it("should allow client to submit form unsuccessfully middleware fail answer not string", async () => {
    const client_submission = { ...FORM_MOCK } as any;
    client_submission.code = code;
    client_submission.SSN = {};
    client_submission.address = "testing address";
    client_submission.lastName = "faker";
    const { body, status } = await request(app)
      .post("/client/form-submission")
      .send({ form: client_submission });
    expect(status).toBe(BAD_REQUEST);
    expect(body.hawkError.src).toBe("infoDataMiddleware");
  });

  it("should delete submissions successfully", async () => {
    const client_submission = { ...FORM_MOCK } as any;
    client_submission.code = code;
    client_submission.SSN = { input: "123", inputType: "single" };
    client_submission.address = { input: "testing address", inputType: "single" };
    client_submission.lastName = { input: "faker", inputType: "single" };
    const { body, status } = await request(app)
      .post("/client/form-submission")
      .send({ form: client_submission });
    expect(status).toBe(CREATED);
    expect(body.msg).toBe("Submission successful!");
    expect(body.messageId).toBe("123");

    let form = (await db.grabOne("forms", { isSkeleton: false })) as any;
    expect(form).toBeDefined();
    expect(form._id).toBeDefined();
    const res = await request(app)
      .delete("/auth/forms/submissions/delete")
      .send({ code, formId: form._id });
    expect(res.body.msg).toBe("Submission deleted successfully!");
    expect(res.status).toBe(OK);
    form = await db.grabOne("forms", { isSkeleton: false });
    expect(form).toBe(null);
  });

  it("should delete submissions unsuccessfully wrong code", async () => {
    const client_submission = { ...FORM_MOCK } as any;
    client_submission.code = code;
    client_submission.SSN = { input: "123", inputType: "single" };
    client_submission.address = { input: "testing address", inputType: "single" };
    client_submission.lastName = { input: "faker", inputType: "single" };
    const { body, status } = await request(app)
      .post("/client/form-submission")
      .send({ form: client_submission });
    expect(status).toBe(CREATED);
    expect(body.msg).toBe("Submission successful!");
    expect(body.messageId).toBe("123");

    let form = (await db.grabOne("forms", { isSkeleton: false })) as any;
    expect(form).toBeDefined();
    expect(form._id).toBeDefined();

    const res = await request(app)
      .delete("/auth/forms/submissions/delete")
      .send({ code: "badCode123", formId: form._id });
    expect(res.body.hawkError.msg).toBe(FORM_EDIT_CODE_ERR);
    expect(res.status).toBe(NOT_FOUND);
  });

  it("should delete submissions unsuccessfully wrong form", async () => {
    const client_submission = { ...FORM_MOCK } as any;
    client_submission.code = code;
    client_submission.SSN = { input: "123", inputType: "single" };
    client_submission.address = { input: "testing address", inputType: "single" };
    client_submission.lastName = { input: "faker", inputType: "single" };
    const { body, status } = await request(app)
      .post("/client/form-submission")
      .send({ form: client_submission });
    expect(status).toBe(CREATED);
    expect(body.msg).toBe("Submission successful!");
    expect(body.messageId).toBe("123");

    let form = (await db.grabOne("forms", { isSkeleton: false })) as any;
    expect(form).toBeDefined();
    expect(form._id).toBeDefined();

    const res = await request(app)
      .delete("/auth/forms/submissions/delete")
      .send({ code, formId: new Types.ObjectId() });
    expect(res.body.hawkError.msg).toBe(UNKNOWN_ERR_MSG);
    expect(res.status).toBe(BAD_REQUEST);
  });

  it("should delete user account with skeletons and submissions successfully", async () => {
    const client_submission = { ...FORM_MOCK } as any;
    client_submission.code = code;
    client_submission.SSN = { input: "123", inputType: "single" };
    client_submission.address = { input: "testing address", inputType: "single" };
    client_submission.lastName = { input: "faker", inputType: "single" };
    const { body, status } = await request(app)
      .post("/client/form-submission")
      .send({ form: client_submission });
    expect(status).toBe(CREATED);
    expect(body.msg).toBe("Submission successful!");
    expect(body.messageId).toBe("123");

    const client_submission2 = { ...FORM_MOCK } as any;
    client_submission2.code = code;
    client_submission2.SSN = "123";
    client_submission2.address = "testing address";
    client_submission2.lastName = "faker";
    const { body: body2, status: status2 } = await request(app)
      .post("/client/form-submission")
      .send({ form: client_submission });
    expect(status2).toBe(CREATED);
    expect(body2.msg).toBe("Submission successful!");
    expect(body2.messageId).toBe("123");

    let user = (await db.grabOne("admins")) as any;
    const id = user._id.toString();
    expect(user._id).toBeDefined;
    const { body: body3, status: status3 } = await request(app)
      .delete("/auth/account/delete")
      .send({ id });
    expect(body3.msg).toBe("Account deleted successfully!");
    expect(status3).toBe(OK);
    user = await db.grabOne("admins");
    const anyForm = await db.grabOne("forms");
    expect(user).toBe(null);
    expect(anyForm).toBe(null);
  });
});
