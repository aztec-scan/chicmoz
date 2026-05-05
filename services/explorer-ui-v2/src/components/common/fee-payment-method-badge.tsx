import { type FC } from "react";

interface Props {
  method: string | undefined;
}

const LABEL: Record<string, string> = {
  fee_juice: "fee juice",
  fpc: "fpc",
};

const TONE: Record<string, string> = {
  fee_juice: "tag-chip-purple",
  fpc: "tag-chip-warn",
};

export const FeePaymentMethodBadge: FC<Props> = ({ method }) => {
  if (!method) {return null;}
  const label = LABEL[method] ?? method;
  const tone = TONE[method] ?? "";
  return (
    <span
      className={`tag-chip ${tone}`.trim()}
      title={`Fee payment method: ${method}`}
    >
      {label}
    </span>
  );
};
