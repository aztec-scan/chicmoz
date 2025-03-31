import { type FC } from "react";
import { JsonViewer } from "../json-viewer";

interface JsonTabProps {
  data: unknown
}

export const JsonTab: FC<JsonTabProps> = ({ data }) => {
  return <JsonViewer data={data} />;
};
