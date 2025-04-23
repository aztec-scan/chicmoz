import { Link } from "@tanstack/react-router";
import { routes } from "~/routes/__root";

export const getClassVersionLink = (
  contractClassId: string | null,
  version: number | null,
  linkText?: string,
) => {
  if (typeof contractClassId !== "string") {
    return null;
  }
  if (typeof version !== "number") {
    return null;
  }
  const r = `${routes.contracts.route}/${routes.contracts.children.classes.route}/${contractClassId}/versions/${version}`;
  return (
    <div className="text-purple-light font-mono">
      <Link to={r}>{linkText ?? version}</Link>
    </div>
  );
};
