import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";

enum TokenType {
  VERIFY = "Verify",
  RESET = "RESET"
}

@modelOptions({ schemaOptions: { _id: false, timestamps: true } })
class Token {
  @prop({ required: true, unique: true, index: true })
  public value!: string;

  @prop({ required: true, enum: TokenType, default: TokenType.VERIFY })
  public type!: string;
}

export default getModelForClass(Token);
