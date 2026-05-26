import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0"); // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};
export const hexToHSL = (hex: string): string => {
  if (hex === "#fff" || hex === "#ffffff") {
    return "hsl(0, 0%, 100%)";
  }

  if (hex === "#000" || hex === "#000000") {
    return "hsl(0, 0%, 0%)";
  }

  const r = parseInt(hex.substring(1, 3), 16) / 255;
  const g = parseInt(hex.substring(3, 5), 16) / 255;
  const b = parseInt(hex.substring(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = (max + min) / 2;
  let s = (max + min) / 2;
  let l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  s = s * 100;
  s = Math.round(s);
  l = l * 100;
  l = Math.round(l);
  h = Math.round(360 * h);

  return `hsl(${h}, ${s}%, ${l}%)`;
};

const intervals = [
  { label: "day", seconds: 86400, shortLabel: "day" },
  { label: "hour", seconds: 3600, shortLabel: "hr" },
  { label: "minute", seconds: 60, shortLabel: "min" },
  { label: "second", seconds: 1, shortLabel: "sec" },
];

export const formatDuration = (
  durationMilliseconds: number,
  short?: boolean,
) => {
  const durationSeconds = durationMilliseconds / 1000;
  for (const interval of intervals) {
    const count = Math.floor(durationSeconds / interval.seconds);
    if (count >= 1) {
      const label = short ? interval.shortLabel : interval.label;
      return `${count} ${label}${count > 1 ? "s" : ""}`;
    }
  }
  return "just now";
};

export const formatTimeSince = (
  unixTimestamp: number | null | undefined,
  short = true,
) => {
  if (!unixTimestamp) {
    return "no timestamp";
  }
  const now = Math.floor(Date.now());
  const milisecondsSince = Math.round(now - unixTimestamp);
  const duration = formatDuration(milisecondsSince, short);
  if (duration === "just now") {
    return duration;
  }
  return `${duration}`;
};

export const getFeeJuiceSymbol = (symbol?: string): string => {
  return symbol ?? "AZTEC";
};

const formatWithSignificantDigits = (
  value: bigint,
  decimals: number,
  significantDigits = 4,
): string => {
  if (value === 0n) {
    return "0";
  }

  const rawDigits = value.toString();
  const integerPartRaw =
    rawDigits.length > decimals
      ? rawDigits.slice(0, rawDigits.length - decimals)
      : "0";
  const fractionPartRaw =
    rawDigits.length > decimals
      ? rawDigits.slice(rawDigits.length - decimals)
      : rawDigits.padStart(decimals, "0");
  const integerPartNormalized = integerPartRaw.replace(/^0+/, "") || "0";
  const hasIntegerPart = integerPartNormalized !== "0";

  let fractionDigits: number;

  if (hasIntegerPart) {
    fractionDigits = Math.max(
      significantDigits - integerPartNormalized.length,
      0,
    );
  } else {
    const firstNonZeroIndex = fractionPartRaw.search(/[1-9]/);

    if (firstNonZeroIndex === -1) {
      return "0";
    }

    fractionDigits = firstNonZeroIndex + significantDigits;
  }

  let roundedValue: bigint;

  if (fractionDigits >= decimals) {
    roundedValue = value * 10n ** BigInt(fractionDigits - decimals);
  } else {
    const divisor = 10n ** BigInt(decimals - fractionDigits);
    roundedValue = (value + divisor / 2n) / divisor;
  }

  if (fractionDigits === 0) {
    return roundedValue.toString();
  }

  const scale = 10n ** BigInt(fractionDigits);
  const integerPart = roundedValue / scale;
  const fractionalPart = (roundedValue % scale)
    .toString()
    .padStart(fractionDigits, "0");

  return `${integerPart.toString()}.${fractionalPart}`;
};

export const formatCompactUnits = (value: bigint, decimals = 18): string => {
  const isNegative = value < 0n;
  const absoluteValue = isNegative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const oneThousand = 1_000n * base;

  let formattedValue: string;

  if (absoluteValue < oneThousand) {
    formattedValue = formatWithSignificantDigits(absoluteValue, decimals);
  } else if (absoluteValue <= 999_999n * base) {
    formattedValue = `${formatWithSignificantDigits(absoluteValue, decimals + 3)}k`;
  } else {
    formattedValue = `${formatWithSignificantDigits(absoluteValue, decimals + 6)}M`;
  }

  return isNegative ? `-${formattedValue}` : formattedValue;
};

export const formatFees = (
  fees: string | undefined,
  decimals = 18,
): { denomination: string; value: string } => {
  if (fees === undefined) {
    return { denomination: "", value: "No data" };
  }

  try {
    return {
      denomination: "",
      value: formatCompactUnits(BigInt(fees), decimals),
    };
  } catch {
    return { denomination: "", value: "No data" };
  }
};
