import { getModelForClass, pre, prop, ReturnModelType } from "@typegoose/typegoose";
import bcrypt from "bcrypt";
import { BCRYPT_SALT } from "../../config/keys.env";
import { BAD_REQUEST, LOGIN_ERR_MSG, UNKNOWN_ERR_MSG } from "../../config/keys.error";
import { IHError } from "../../types/errors";

@pre<Admin>("save", async function (next: Function): Promise<void> {
  try {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, BCRYPT_SALT);
    }
    next();
  } catch (err) {
    console.error(err);
  }
})
class Admin {
  @prop({ required: true })
  public firstName!: string;

  @prop({ required: true })
  public lastName!: string;

  @prop({ required: true, unique: true, index: true })
  public email!: string;

  @prop({ required: true })
  public password!: string;

  @prop({ required: true, default: "NA" })
  public code!: string;

  public static async login(this: ReturnModelType<typeof Admin>, email: string, password: string) {
    const hawkError: IHError = { msg: UNKNOWN_ERR_MSG, src: "Login", status: BAD_REQUEST };
    try {
      const admin = await this.findOne({ email });
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
  }
}

export default getModelForClass(Admin);
