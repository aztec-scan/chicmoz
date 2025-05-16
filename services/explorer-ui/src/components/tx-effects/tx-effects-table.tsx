import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { TxEffectsTableColumns } from "./tx-effects-columns";
import { type UiTxEffectTable } from "@chicmoz-pkg/types";

interface Props {
  title?: string;
  txEffects?: UiTxEffectTable[];
  isLoading: boolean;
  error?: Error | null;
  disableSizeSelector?: boolean;
  maxEntries?: number;
}

export const TxEffectsTable: FC<Props> = ({
  title,
  txEffects,
  isLoading,
  error,
  disableSizeSelector,
  maxEntries = 10,
}) => {
  if (error) {
    return <p className="text-red-500">{error.message}</p>;
  }
  return (
    <section className="relative mx-0 w-full transition-all">
      <div className="space-y-4 bg-white rounded-lg p-5">
        {title && (
          <div className="flex flex-row justify-between md:min-h-20">
            <h3 className="ml-0.5">{title}</h3>
          </div>
        )}
        <DataTable
          isLoading={isLoading}
          data={txEffects ?? []}
          columns={TxEffectsTableColumns}
          disableSizeSelector={disableSizeSelector}
          maxEntries={maxEntries}
        />
      </div>
    </section>
  );
};
