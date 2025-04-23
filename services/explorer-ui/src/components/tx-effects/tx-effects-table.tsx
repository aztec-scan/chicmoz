import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { Checkbox } from "../ui/checkbox";
import { TxEffectsTableColumns } from "./tx-effects-columns";
import { type TxEffectTableSchema } from "./tx-effects-schema";

interface Props {
  title?: string;
  txEffects?: TxEffectTableSchema[];
  isLoading: boolean;
  error?: Error | null;
  disableSizeSelector?: boolean;
  showPending: boolean;
  handleTogglePendingTx?: (checked: boolean) => void;
  nbrOfPendingTxs?: number;
}

export const TxEffectsTable: FC<Props> = ({
  title,
  txEffects,
  isLoading,
  error,
  disableSizeSelector,
  showPending,
  handleTogglePendingTx,
  nbrOfPendingTxs,
}) => {
  if (!txEffects) {
    return <div>No data</div>;
  }
  if (error) {
    return <p className="text-red-500">{error.message}</p>;
  }
  return (
    <section className="relative mx-0 w-full transition-all">
      <div className="space-y-4 bg-white rounded-lg p-5">
        {title && (
          <div className="flex flex-row justify-between">
            <h3 className="ml-0.5">{title}</h3>
            {handleTogglePendingTx && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms2"
                  onCheckedChange={handleTogglePendingTx}
                  defaultChecked={true}
                  checked={showPending}
                />
                <label
                  htmlFor="terms2"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Show pending
                  {Number.isInteger(nbrOfPendingTxs) && ` (${nbrOfPendingTxs})`}
                </label>
              </div>
            )}
          </div>
        )}

        <DataTable
          isLoading={isLoading}
          data={txEffects}
          columns={TxEffectsTableColumns}
          disableSizeSelector={disableSizeSelector}
        />
      </div>
    </section>
  );
};
