import { getModelForClass, index, modelOptions, prop } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { _id: false, timestamps: true } })
@index({ value: 1 })
class Token {
  @prop({ required: true, unique: true })
  value!: string;
}

export default getModelForClass(Token);
