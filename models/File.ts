import {
  Schema,
  models,
  model,
  Model,
  InferSchemaType,
  HydratedDocument,
  Types,
} from "mongoose";

const FileSchema = new Schema(
  {
    name: { type: String, required: true }, // 원본 파일명
    address: { type: String, required: true }, // Vercel Blob key
    url: { type: String, required: true }, // 공개 URL
    postType: { type: String, required: true, enum: ["notice", "info", "qna"] },
    // refPath는 postType을 사용
    post: { type: Schema.Types.ObjectId, required: true, refPath: "postType" },
  },
  { timestamps: true }
);

export type FileAttrs = InferSchemaType<typeof FileSchema>;
export type FileDoc = HydratedDocument<FileAttrs>;

export const File: Model<FileAttrs> =
  (models.File as Model<FileAttrs>) || model<FileAttrs>("File", FileSchema);
