import {
  Schema,
  models,
  model,
  Model,
  InferSchemaType,
  HydratedDocument,
  Types,
} from "mongoose";

const commonShape = {
  title: { type: String, required: true },
  writer: { type: String, required: true },
  content: { type: String, required: true },
  view: { type: Number, required: true, default: 0 },
  files: [{ type: Schema.Types.ObjectId, ref: "File", required: true }],
} as const;

const NoticeSchema = new Schema(commonShape, { timestamps: true });
const InfoSchema = new Schema(commonShape, { timestamps: true });
const QnaSchema = new Schema(commonShape, { timestamps: true });

export type NoticeAttrs = InferSchemaType<typeof NoticeSchema>;
export type InfoAttrs = InferSchemaType<typeof InfoSchema>;
export type QnaAttrs = InferSchemaType<typeof QnaSchema>;

export type NoticeDoc = HydratedDocument<NoticeAttrs>;
export type InfoDoc = HydratedDocument<InfoAttrs>;
export type QnaDoc = HydratedDocument<QnaAttrs>;

export const Notice: Model<NoticeAttrs> =
  (models.Notice as Model<NoticeAttrs>) ||
  model<NoticeAttrs>("Notice", NoticeSchema);

export const Info: Model<InfoAttrs> =
  (models.Info as Model<InfoAttrs>) || model<InfoAttrs>("Info", InfoSchema);

export const Qna: Model<QnaAttrs> =
  (models.Qna as Model<QnaAttrs>) || model<QnaAttrs>("Qna", QnaSchema);
