import { Application, NextFunction, Request, Response } from "express";
import { sign } from "jsonwebtoken";
import { Types } from "mongoose";
import request from "supertest";
import bootstrap from "../../src/config/bootstrap";
import { audience, issuer, JWT_SECRET } from "../../src/config/keys.env";
import {
  BAD_REQUEST,
  CREATED,
  FORM_EDIT_CODE_ERR,
  FORM_EDIT_DOC_ERR,
  FORM_LINK_ADMIN_ERR,
  NOT_FOUND,
  OK
} from "../../src/config/keys.error";
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

  it("should edit form successfully", async () => {
    const newForm = { ...FORM_MOCK } as any;
    newForm.code = code;
    delete newForm.SSN;
    newForm.newAttribute = true;
    const { body, status } = await request(app).post("/auth/forms/edit").send({ form: newForm });
    expect(body.msg).toBe("Form successfully updated!");
    expect(status).toBe(OK);
    const updatedForm = (await db.grabOne("forms")) as any;
    expect(updatedForm).toBeDefined();
    expect(updatedForm.newAttribute).toBeDefined();
    expect(updatedForm.SSN).toBe(undefined);
  });

  it("should edit form unsuccessfully new value not boolean", async () => {
    const newForm = { ...FORM_MOCK } as any;
    newForm.code = code;
    newForm.newAttribute = "new";
    const { body, status } = await request(app).post("/auth/forms/edit").send({ form: newForm });
    expect(body.hawkError.src).toBe("infoDataMiddleware");
    expect(status).toBe(BAD_REQUEST);
  });

  it("should edit form unsuccessfully wrong code", async () => {
    const newForm = { ...FORM_MOCK } as any;
    newForm.code = "badcode123";
    newForm.newAttribute = true;
    const { body, status } = await request(app).post("/auth/forms/edit").send({ form: newForm });
    expect(status).toBe(NOT_FOUND);
    expect(body.hawkError.msg).toBe(FORM_EDIT_CODE_ERR);
  });

  it("should edit form unsuccessfully form not found", async () => {
    const newForm = { ...FORM_MOCK } as any;
    newForm.code = code;
    newForm.title = "wrong title";
    newForm.newAttribute = true;
    const { body, status } = await request(app).post("/auth/forms/edit").send({ form: newForm });
    expect(status).toBe(NOT_FOUND);
    expect(body.hawkError.msg).toBe(FORM_EDIT_DOC_ERR);
  });

  it("should delete form successfully", async () => {
    let form = await db.grabOne("forms");
    expect(form).toBeDefined();
    const { body, status } = await request(app)
      .delete("/auth/forms/delete")
      .send({ title: FORM_MOCK.title, code });
    expect(status).toBe(OK);
    expect(body.msg).toBe("Form successfully deleted!");
    form = await db.grabOne("forms");
    expect(form).toBe(null);
  });

  it("should delete form unusuccessfuly wrong code", async () => {
    const { body, status } = await request(app)
      .delete("/auth/forms/delete")
      .send({ title: FORM_MOCK.title, code: "badcode123" });
    expect(status).toBe(NOT_FOUND);
    expect(body.hawkError.msg).toBe(FORM_EDIT_CODE_ERR);
  });

  it("should delete form unusuccessfuly form not found", async () => {
    const { body, status } = await request(app)
      .delete("/auth/forms/delete")
      .send({ title: "wrong title", code });
    expect(status).toBe(NOT_FOUND);
    expect(body.hawkError.msg).toBe("Something went wrong with deletion...");
  });

  it("should send form link successfully", async () => {
    const form = (await db.grabOne("forms")) as any;
    const admin = (await db.grabOne("admins")) as any;
    expect(form).toBeDefined();
    expect(admin).toBeDefined();
    expect(form._id).toBeDefined();
    expect(admin._id).toBeDefined();

    const { body, status } = await request(app).post(`/auth/forms/link/${admin._id}/${form._id}`);
    expect(body.message).toBe("Form link sent successfully!");
    expect(body.messageId).toBe("123");
    expect(status).toBe(OK);
  });

  it("should send form link unsuccessfully wrong admin id", async () => {
    const admin = (await db.grabOne("admins")) as any;
    expect(admin).toBeDefined();
    expect(admin._id).toBeDefined();

    const { body, status } = await request(app).post(
      `/auth/forms/link/${admin._id}/${new Types.ObjectId()}`
    );
    expect(body.hawkError.msg).toBe(FORM_LINK_ADMIN_ERR);
    expect(status).toBe(NOT_FOUND);
  });

  it("should send form link successfully unsuccessfully wrong form id", async () => {
    const form = (await db.grabOne("forms")) as any;
    expect(form).toBeDefined();
    expect(form._id).toBeDefined();

    const { body, status } = await request(app).post(
      `/auth/forms/link/${new Types.ObjectId()}/${form._id}}`
    );
    expect(body.hawkError.msg).toBe(FORM_LINK_ADMIN_ERR);
    expect(status).toBe(NOT_FOUND);
  });
});
