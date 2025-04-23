import { useTimeTick } from "~/hooks/useTimeTick";
import { formatTimeSince } from "~/lib/utils";

interface TimeAgoCellProps {
  timestamp: number;
}

export const TimeAgoCell = ({ timestamp }: TimeAgoCellProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tick = useTimeTick();
  const formattedTime = formatTimeSince(timestamp);

  return <div className="text-purple-dark">{formattedTime}</div>;
};
