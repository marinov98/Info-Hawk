import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";

export enum TokenType {
  VERIFY = "Verify",
  RESET = "Reset"
}

@modelOptions({ schemaOptions: { timestamps: true } })
class Token {
  @prop({ required: true })
  public owner!: string;

  @prop({ required: true, unique: true, index: true })
  public value!: string;

  @prop({ required: true, enum: TokenType, default: TokenType.VERIFY })
  public type!: string;
}

export default getModelForClass(Token);
