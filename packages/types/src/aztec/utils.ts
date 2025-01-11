import { z } from "zod";

// TODO: use aztec/foundation/schemas instead of "home made" schemas

export type AztecFr = {
  toString(): string;
};

export type AztecAddress = {
  toString(): string;
};

export type StringifiedAztecAddress = {
  type: "AztecAddress";
  value: `0x${string}`;
};

const frToHexString = (val: unknown) => {
  if (!val) return val;
  else if ((val as AztecFr).toString) return (val as AztecFr).toString();
  else return val;
};

// TODO: frSchema should be replaced with
//      z.coerce.bigint().nonnegative()
export const frSchema = z.preprocess(
  frToHexString,
  z
    .string()
    .length(66)
    .regex(/^0x[0-9a-fA-F]+$/)
);

type FrPoint = {
  x: AztecFr;
  y: AztecFr;
  isInfinite: boolean;
  kind: "point";
};

const frPointToObj = (val: unknown) => {
  if (!val) return val;
  else if ((val as FrPoint).x) return val;
  else return val;
};

export const frPointSchema = z.preprocess(
  frPointToObj,
  z.object({
    x: frSchema,
    y: frSchema,
    isInfinite: z.boolean(),
    kind: z.enum(["point"]),
  })
);

export const frNumberSchema = z.preprocess((val) => {
  if (typeof val === "number") return val;
  const v = frToHexString(val);
  if (typeof v === "string") return parseInt(v, 16);
  return val;
}, z.coerce.number());

export const frTimestampSchema = z.preprocess((val) => {
  if (typeof val === "number") return val;
  const v = frToHexString(val);
  if (typeof v === "string" && v.startsWith("0x"))
    return parseInt(v, 16) * 1000;
  return val;
}, z.coerce.number());

export type StringifiedBuffer = {
  type: "Buffer";
  data: number[];
};

export const bufferSchema = z.preprocess(
  (val) => {
    if (val && (val as StringifiedBuffer).data)
      return Buffer.from((val as StringifiedBuffer).data);
    if (val && (val as string)) return Buffer.from(val as string, "hex");
    return val;
  },
  z.custom<Buffer>(
    (value) => {
      return value instanceof Buffer;
    },
    { message: "Expected a Buffer" }
  )
);
