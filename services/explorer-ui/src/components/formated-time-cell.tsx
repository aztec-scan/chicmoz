import { useTimeTick } from "~/hooks/useTimeTick";
import { formatTimeSince } from "~/lib/utils";
import { CustomTooltip } from "./custom-tooltip";

interface TimeAgoCellProps {
  timestamp: number;
}

export const TimeAgoCell = ({ timestamp }: TimeAgoCellProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tick = useTimeTick();

  const dateString = new Date(timestamp * 1000).toLocaleString();

  const formattedTime = formatTimeSince(timestamp);

  return (
    <CustomTooltip content={dateString}>
      <div key={tick} className="text-purple-dark">
        {formattedTime}
      </div>
    </CustomTooltip>
  );
};
