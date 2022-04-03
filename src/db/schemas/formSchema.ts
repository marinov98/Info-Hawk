import { Document, model, Schema } from "mongoose";
import { IFormData } from "../../interfaces/index";

interface IFormDataDoc extends IFormData, Document {
  createdAt: Date;
  updatedAt: Date;
}

const FormSchema: Schema<IFormDataDoc> = new Schema<IFormDataDoc>(
  {
    title: {
      type: String,
      required: true
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
  { strict: false, timestamps: true }
);

export default model<IFormDataDoc>("Form", FormSchema);
