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
  if (!val) {
    return val;
  } else if ((val as AztecFr).toString) {
    return (val as AztecFr).toString();
  } else {
    return val;
  }
};

const hexStringToBigInt = (value: string): bigint => {
  return BigInt(value);
};

const decimalStringSchema = z.string().regex(/^\d+$/);

const parseFrLikeToBigInt = (val: unknown): unknown => {
  if (typeof val === "bigint") {
    return val;
  }

  if (typeof val === "number") {
    if (Number.isSafeInteger(val) && val >= 0) {
      return BigInt(val);
    }
    return val;
  }

  const value = frToHexString(val);

  if (typeof value !== "string") {
    return val;
  }

  if (value.startsWith("0x")) {
    return hexStringToBigInt(value);
  }

  if (/^\d+$/.test(value)) {
    return BigInt(value);
  }

  return val;
};

export const frSchema = z.preprocess(
  frToHexString,
  z
    .string()
    .length(66)
    .regex(/^0x[0-9a-fA-F]+$/),
);

export const concatFrPointSchema = z.preprocess(
  frToHexString,
  z
    .string()
    .length(130)
    .regex(/^0x[0-9a-fA-F]+$/),
);

export const frDecimalStringSchema = z.preprocess((val) => {
  if (typeof val === "string" && /^\d+$/.test(val)) {
    return val;
  }

  const parsed = parseFrLikeToBigInt(val);
  if (typeof parsed === "bigint") {
    return parsed.toString();
  }

  return val;
}, decimalStringSchema);

export const frSmallIntSchema = z.preprocess(
  (val) => {
    if (typeof val === "number") {
      return val;
    }

    const parsed = parseFrLikeToBigInt(val);
    if (typeof parsed === "bigint") {
      const numberValue = Number(parsed);
      if (Number.isSafeInteger(numberValue) && numberValue >= 0) {
        return numberValue;
      }
    }

    return val;
  },
  z
    .number()
    .int()
    .nonnegative()
    .refine(Number.isSafeInteger, "Expected a safe integer"),
);

export const frTimestampSchema = z.preprocess(
  (val) => {
    if (typeof val === "number") {
      return val;
    }

    const parsed = parseFrLikeToBigInt(val);
    if (typeof parsed === "bigint") {
      const timestampMs = parsed * 1000n;
      const numberValue = Number(timestampMs);
      if (Number.isSafeInteger(numberValue) && numberValue >= 0) {
        return numberValue;
      }
    }

    return val;
  },
  z
    .number()
    .int()
    .nonnegative()
    .refine(Number.isSafeInteger, "Expected a safe timestamp"),
);

export type StringifiedBuffer = {
  type: "Buffer";
  data: number[];
};

export const bufferSchema = z.preprocess(
  (val) => {
    if (val && (val as StringifiedBuffer).data) {
      return Buffer.from((val as StringifiedBuffer).data);
    }
    if (val && (val as string)) {
      return Buffer.from(val as string, "hex");
    }
    return val;
  },
  z.custom<Buffer>(
    (value) => {
      return value instanceof Buffer;
    },
    { message: "Expected a Buffer" },
  ),
);
