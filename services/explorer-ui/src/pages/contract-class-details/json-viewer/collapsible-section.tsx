import { type FC, type ReactNode, useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export const CollapsibleSection: FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-gray-200 rounded-md mb-2">
      <div
        className="flex justify-between items-center p-2 bg-gray-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-md font-medium">{title}</h3>
        <span>{isExpanded ? "↑" : "↓"}</span>
      </div>
      {isExpanded && <div className="p-2">{children}</div>}
    </div>
  );
};
