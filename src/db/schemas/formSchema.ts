import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { Types } from "mongoose";

@modelOptions({ schemaOptions: { timestamps: true, strict: false } })
class Form {
  @prop({ required: true })
  public title!: string;

  @prop({ required: true, default: false })
  public isSkeleton!: boolean;

  @prop({ ref: "Admin", required: true })
  public adminId!: Types.ObjectId;
}

export default getModelForClass(Form);
