import { type FC } from "react";

interface JsonDisplayProps {
  data: unknown;
}

export const JsonDisplay: FC<JsonDisplayProps> = ({ data }) => {
  return <pre className="overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
};
