import type { FC } from "react";
import { CopyableJson } from "~/components/copyable-json";

interface JsonTabProps {
  data: unknown;
}

export const JsonTab: FC<JsonTabProps> = ({ data }) => {
  return <CopyableJson data={data} />;
};
