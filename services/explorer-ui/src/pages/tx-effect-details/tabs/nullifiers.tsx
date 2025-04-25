import { type FC } from "react";
import { GenericListDisplay } from "~/components/info-display/generic-list-display";

interface NullifierProps {
  nullifiers: string[];
}
export const Nullifiers: FC<NullifierProps> = ({ nullifiers }) => (
  <GenericListDisplay
    title="Nullifiers"
    items={nullifiers}
    itemLabel="Nullifier"
  />
);
