import {
  Schema,
  models,
  model,
  Model,
  InferSchemaType,
  HydratedDocument,
} from "mongoose";

const ChargeSchema = new Schema(
  {
    first: Number,
    second: Number,
    third: Number,
    fourth: Number,
    fifth: Number,
    normal: Number,
    reduce: Number,
    medical: Number,
    basic: Number,
    M30: Number,
    M60: Number,
    M90: Number,
    M120: Number,
    M150: Number,
    M180: Number,
    M210: Number,
    M240: Number,
  },
  { timestamps: true }
);

export type ChargeAttrs = InferSchemaType<typeof ChargeSchema>;
export type ChargeDoc = HydratedDocument<ChargeAttrs>;

export const Charge: Model<ChargeAttrs> =
  (models.Charge as Model<ChargeAttrs>) ||
  model<ChargeAttrs>("Charge", ChargeSchema);
