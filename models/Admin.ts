import {
  Schema,
  models,
  model,
  Model,
  InferSchemaType,
  HydratedDocument,
} from "mongoose";

const AdminSchema = new Schema(
  {
    id: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

// v8 권장 타입 방식
export type AdminAttrs = InferSchemaType<typeof AdminSchema>;
export type AdminDoc = HydratedDocument<AdminAttrs>;

// 명시적 모델 타입: Model<AdminAttrs>
export const Admin: Model<AdminAttrs> =
  (models.Admin as Model<AdminAttrs>) ||
  model<AdminAttrs>("Admin", AdminSchema);
