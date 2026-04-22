import { type FC } from "react";
import { Badge } from "~/components/ui/badge";

type Props = {
  method: string;
};

export const FeePaymentMethodBadge: FC<Props> = ({ method }) => {
  if (method === "fee_juice") {
    return <Badge variant="success">Fee Juice</Badge>;
  }
  return <Badge variant="secondary">FPC</Badge>;
};
