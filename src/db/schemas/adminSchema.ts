import bcrypt from "bcrypt";
import { Document, model, Model, Schema } from "mongoose";
import { BAD_REQUEST, LOGIN_ERR_MSG, UNKNOWN_ERR_MSG } from "./../../config/keys.error";
import { IAdmin } from "./../../interfaces/index";
import { IHError, Maybe } from "./../../types/errors";

interface IAdminDoc extends IAdmin, Document {}

interface IAdminModel extends Model<IAdminDoc> {
  login(email: string, password: string): Promise<Maybe<IAdminDoc>>;
}

const AdminSchema: Schema<IAdminDoc> = new Schema<IAdminDoc>({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  password: {
    type: String,
    reqired: true
  }
});

AdminSchema.pre<IAdminDoc>("save", async function (next: Function): Promise<void> {
  try {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 12);
    }
    next();
  } catch (err) {
    console.error(err);
  }
});

AdminSchema.static("login", async function (email: string, password: string): Promise<
  Maybe<IAdminDoc>
> {
  const hawkError: IHError = { msg: UNKNOWN_ERR_MSG, src: "Login", status: BAD_REQUEST };
  try {
    const admin: IAdminDoc = await this.findOne({ email });
    if (admin) {
      if (await bcrypt.compare(password, admin.password)) {
        return admin;
      }
    }
    hawkError.msg = LOGIN_ERR_MSG;
    return hawkError;
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      if (e.message) hawkError.msg = e.message;
    }
    return hawkError;
  }
});

export default model<IAdminDoc, IAdminModel>("Admin", AdminSchema);
