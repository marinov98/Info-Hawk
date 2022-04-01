import { Schema } from "mongoose";

export default interface IFormData {
  title: string;
  isSkeleton: boolean;
  adminId: typeof Schema.Types.ObjectId;
}
