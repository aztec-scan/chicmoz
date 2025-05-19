import { useEffect, useState, type FC } from "react";

interface DeterministicStatusBadgeProps {
  text: string;
  className?: string;
  tooltipContent?: string;
  isDarkText?: boolean;
}

const COLOR_BASE = 220; // Increased from 128 to make it more whitish

const hashString = async (str: string): Promise<Uint8Array> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuffer);
};

const getTrueColor = (digest: Uint8Array): [number, number, number] => {
  const red = digest[0] >> 2; // Reduced impact (using >> 2 instead of >> 1)
  const green = digest[1] >> 2;
  const blue = digest[2] >> 2;

  const paletteNbr = digest[0] % 3;

  switch (paletteNbr) {
    case 0:
      return [COLOR_BASE + red, COLOR_BASE + green, COLOR_BASE];
    case 1:
      return [COLOR_BASE + red, COLOR_BASE, COLOR_BASE + blue];
    case 2:
      return [COLOR_BASE, COLOR_BASE + green, COLOR_BASE + blue];
    default:
      return [COLOR_BASE + 32, COLOR_BASE + 32, COLOR_BASE + 32];
  }
};

const getDerivedColors = (
  bgColor: [number, number, number],
  isDarkText: boolean,
): { textColor: string; borderColor: string } => {
  const [r, g, b] = bgColor;

  if (isDarkText) {
    const textR = Math.round(r * 0.2);
    const textG = Math.round(g * 0.2);
    const textB = Math.round(b * 0.2);

    const borderR = Math.round(r * 0.5);
    const borderG = Math.round(g * 0.5);
    const borderB = Math.round(b * 0.5);

    return {
      textColor: `rgb(${textR}, ${textG}, ${textB})`,
      borderColor: `rgb(${borderR}, ${borderG}, ${borderB})`,
    };
  } else {
    const textR = Math.round(r * 0.3);
    const textG = Math.round(g * 0.3);
    const textB = Math.round(b * 0.3);

    const borderR = Math.round(r * 0.6);
    const borderG = Math.round(g * 0.6);
    const borderB = Math.round(b * 0.6);

    return {
      textColor: `rgb(${textR}, ${textG}, ${textB})`,
      borderColor: `rgb(${borderR}, ${borderG}, ${borderB})`,
    };
  }
};

export const DeterministicStatusBadge: FC<DeterministicStatusBadgeProps> = ({
  text,
  className = "",
  isDarkText = false,
}) => {
  const [colors, setColors] = useState<[number, number, number]>([
    240, 240, 240,
  ]);

  useEffect(() => {
    const calculateColors = async () => {
      const digest = await hashString(text);
      setColors(getTrueColor(digest));
    };

    calculateColors().catch((error) => {
      console.error("Error calculating colors:", error);
      setColors([240, 240, 240]);
    });
  }, [text]);

  const [red, green, blue] = colors;
  const { textColor, borderColor } = getDerivedColors(colors, isDarkText);

  const badgeStyle = {
    backgroundColor: `rgb(${red}, ${green}, ${blue})`,
    color: textColor,
    borderColor: borderColor,
  };

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium border ${className}`}
      style={badgeStyle}
    >
      {text}
    </span>
  );
};
