import { type FC } from "react";

interface Props {
  name: string;
  verified?: boolean;
  protocol?: boolean;
}

/** 2-letter avatar glyph for a class or instance row. */
export const Glyph: FC<Props> = ({ name, verified, protocol }) => {
  const letters =
    name.replace(/[a-z]/g, "").slice(0, 2) || name.slice(0, 2).toUpperCase();
  const className =
    "cn-glyph" + (protocol ? " protocol" : verified ? " verified" : "");
  return <div className={className}>{letters || "??"}</div>;
};
