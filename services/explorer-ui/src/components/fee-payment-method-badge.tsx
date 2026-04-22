import { type FC } from "react";

type FeePaymentMethod = "fee_juice" | "fpc";

type FeePaymentMethodBadgeProps = {
  method: FeePaymentMethod;
};

const METHOD_LABELS: Record<FeePaymentMethod, string> = {
  fee_juice: "Fee Juice",
  fpc: "Fee Payment Contract",
};

const METHOD_CLASSES: Record<FeePaymentMethod, string> = {
  fee_juice: "bg-purple-100 text-purple-800 border border-purple-300",
  fpc: "bg-blue-100 text-blue-800 border border-blue-300",
};

export const FeePaymentMethodBadge: FC<FeePaymentMethodBadgeProps> = ({
  method,
}) => {
  const label = METHOD_LABELS[method] ?? method;
  const classes =
    METHOD_CLASSES[method] ??
    "bg-gray-100 text-gray-800 border border-gray-300";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
};
