import { type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { BaseLayout } from "~/layout/base-layout";

interface LoadingDetailsProps {
  title: string;
  description?: string;
  emptyData?: { label: string; value: string | undefined }[];
}
export const LoadingDetails: FC<LoadingDetailsProps> = ({
  title,
  description,
  emptyData,
}) => {
  return (
    <BaseLayout>
      <div>
        <div className="flex flex-wrap m-3">
          <h3 className="text-primary md:hidden">{title}</h3>
          <h2 className="hidden md:block md:mt-8 md:text-primary">{title}</h2>
        </div>
        <div className="flex flex-col gap-4 mt-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            {description && <h4 className="text-primary">{description}</h4>}
            <KeyValueDisplay data={emptyData ? emptyData : []} />
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};
