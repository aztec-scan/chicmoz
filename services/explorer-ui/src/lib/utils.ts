import { type ClassValue, clsx } from "clsx";
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
  if (hex === "#fff" || hex === "#ffffff") return "hsl(0, 0%, 100%)";

  if (hex === "#000" || hex === "#000000") return "hsl(0, 0%, 0%)";

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
  { label: "day", seconds: 86400 },
  { label: "hour", seconds: 3600 },
  { label: "minute", seconds: 60 },
  { label: "second", seconds: 1 },
];

export const formatDuration = (durationSeconds: number) => {
  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    const count = Math.floor(durationSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""}`;
    }
  }
  return "just now";
};

export const formatTimeSince = (unixTimestamp: number | null) => {
  if (unixTimestamp === null) return "no timestamp";
  const now = new Date().getTime();
  const secondsSince = Math.round((now - unixTimestamp) / 1000);
  const duration = formatDuration(secondsSince);
  if (duration === "just now") return duration;
  return `${duration} ago`;
};
