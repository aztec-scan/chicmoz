import { type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";

interface LoadingDetailsProps {
  title: string;
  emptyData: { label: string; value: string | undefined }[];
}
export const LoadingDetails: FC<LoadingDetailsProps> = ({
  title,
  emptyData,
}) => {
  return (
    <div className="mx-auto px-7 max-w-[1440px] md:px-[70px]">
      <div>
        <div className="flex flex-wrap m-3">
          <h3 className="text-primary md:hidden">Tx Effects Details</h3>
          <h2 className="hidden md:block md:mt-8 md:text-primary">{title}</h2>
        </div>
        <div className="flex flex-col gap-4 mt-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <KeyValueDisplay data={emptyData} />
          </div>
        </div>
      </div>
    </div>
  );
};
