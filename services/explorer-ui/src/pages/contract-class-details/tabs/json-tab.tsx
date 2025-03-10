import { type FC } from "react";

interface JsonTabProps {
  data: unknown
}
export const JsonTab: FC<JsonTabProps> = ({ data }) => {
  return <pre className="overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
};
