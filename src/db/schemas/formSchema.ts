import { Document, model, Schema } from "mongoose";
import { IFormData } from "../../interfaces/index";

interface IFormDataDoc extends IFormData, Document {}

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
  { strict: false }
);

export default model<IFormDataDoc>("Form", FormSchema);
