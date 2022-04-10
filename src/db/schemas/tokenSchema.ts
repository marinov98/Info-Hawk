import { getModelForClass, index, modelOptions, prop } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { _id: false } })
@index({ value: 1 })
class Token {
  @prop({ required: true })
  value!: string;
}

export default getModelForClass(Token);
