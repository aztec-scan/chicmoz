import { ChevronDown, ChevronUp } from "lucide-react";
import {
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import { Loader } from "./loader";

interface InfoCardProps {
  title: ReactNode;
  header?: ReactNode;
  details?: string;
  isLoading: boolean;
  error: Error | null;
}

export const InfoCard: FC<InfoCardProps> = ({
  title,
  header,
  details,
  isLoading,
  error,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  const toggleExpand = (e: React.MouseEvent) => {
    // Prevent event propagation to avoid triggering parent link clicks
    e.stopPropagation();
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  const headerContent = useMemo(() => {
    if (error) {
      return error.message;
    }
    if (header) {
      return header;
    }
    return "No Data";
  }, [header, error]);

  // Check if content has overflow
  useEffect(() => {
    if (contentRef.current && details) {
      // Check if the content height exceeds our collapsed container height
      setHasOverflow(contentRef.current.scrollHeight > 52);
    }
  }, [details]);

  return (
    <div
      className={`flex flex-col bg-white w-full justify-between rounded-lg shadow-md ${
        !isExpanded ? "h-40" : ""
      }`}
    >
      <div className="p-5 pb-2 flex-grow overflow-hidden">
        <p className="text-xs text-primary dark:text-white">{title}</p>

        {isLoading ? (
          <Loader amount={1} />
        ) : (
          <>
            <h3 className="text-primary text-lg font-semibold">
              {headerContent}
            </h3>

            {details && (
              <div
                className={`transition-all duration-300 ${
                  isExpanded
                    ? "max-h-[500px] opacity-100 overflow-y-auto"
                    : "max-h-[52px] overflow-hidden opacity-90"
                } ${hasOverflow ? "cursor-pointer" : ""}`}
                onClick={hasOverflow ? toggleExpand : undefined}
              >
                <p ref={contentRef} className="text-xs text-gray-500 mt-2">
                  {details}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {details && hasOverflow && (
        <div className="border-t border-gray-100 pt-2 px-5 pb-3 mt-auto">
          <button
            onClick={toggleExpand}
            className="flex items-center justify-between w-full text-left text-xs"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <>
                <span className="text-purple-light">Hide details</span>
                <ChevronUp className="h-4 w-4 text-gray-500" />
              </>
            ) : (
              <>
                <span className="text-purple-light">Show more details</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
