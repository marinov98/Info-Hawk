import { Document, Model, model, Schema } from "mongoose";
import { IFormData } from "../../interfaces";

interface IFormDataDoc extends IFormData, Document {
  adminId: typeof Schema.Types.ObjectId;
  isSkeleton: boolean;
}

interface IFormDataModel extends Model<IFormDataDoc> {}

const FormDataSchema: Schema<IFormDataDoc> = new Schema<IFormDataDoc>(
  {
    title: {
      type: String,
      required: true
    },
    code: {
      type: String
    },
    isSkeleton: {
      type: Boolean,
      required: true,
      default: false
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    }
  },
  { strict: false }
);

export default model<IFormDataDoc, IFormDataModel>("FormData", FormDataSchema);
