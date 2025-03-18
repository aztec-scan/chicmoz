import { type FC, useMemo } from "react";
import { Loader } from "./loader";

interface InfoBadgeProps {
  title: string;
  data?: string;
  isLoading: boolean;
  error: Error | null;
}
export const InfoBadge: FC<InfoBadgeProps> = ({
  title,
  data,
  isLoading,
  error,
}) => {
  const text = useMemo(() => {
    if (error) { return error.message; }
    if (data) { return data; }
    return "No Data";
  }, [data, error]);

  return (
    <div className="flex flex-col bg-white w-full justify-between rounded-lg shadow-md p-4">
      <p className="text-sm text-primary dark:text-white">{title}</p>
      {isLoading ? (
        <Loader amount={1} />
      ) : (
        <h3 className="text-primary">{text}</h3>
      )}
    </div>
  );
};
