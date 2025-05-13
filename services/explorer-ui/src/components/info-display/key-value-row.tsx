import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import { truncateHashString } from "~/lib/create-hash-string";
import { BlockStatusBadge } from "../block-status-badge";
import { CopyableText } from "../copy-text";
import { CustomTooltip } from "../custom-tooltip";
import { Loader } from "../loader";

interface KeyValueRowProps {
  label: string;
  value?: string;
  link?: string;
  isLast?: boolean;
  extLink?: string;
  tooltip?: string;
}

enum DisplayType {
  TEXT = "text",
  TEXTAREA = "textarea",
  LINK = "link",
  HEX = "hex",
  EXTERNAL_LINK = "external-link",
  BADGE = "badge",
  LOADING = "loading",
  tooltip = "tooltip",
}

export const KeyValueRow: FC<KeyValueRowProps> = ({
  label,
  value,
  isLast,
  link,
  extLink,
  tooltip,
}) => {
  let displayType = DisplayType.TEXT;
  if (link) {
    displayType = DisplayType.LINK;
  } else if (label === "data") {
    displayType = DisplayType.TEXTAREA;
  } else if (!value) {
    displayType = DisplayType.LOADING;
  } else if (value.startsWith("0x")) {
    displayType = DisplayType.HEX;
  } else if (extLink) {
    displayType = DisplayType.EXTERNAL_LINK;
  } else if (label.includes("status")) {
    displayType = DisplayType.BADGE;
  }
  const commonTextClasses = "text-sm flex-grow text-end justify-end ";

  if (!value) {
    return (
      <div
        key={label}
        className={`flex items-center gap-2 py-3 ${
          !isLast ? "border-b border-gray-200 dark:border-gray-700" : ""
        }`}
      >
        <span className="text-gray-600 dark:text-gray-300 w-1/3">{label}</span>
        <Loader amount={1} />
      </div>
    );
  }

  return (
    <div
      key={label}
      className={`flex items-center gap-2 py-3 ${
        !isLast ? "border-b border-gray-200 dark:border-gray-700" : ""
      }`}
    >
      <span className="text-gray-600 dark:text-gray-300 w-1/3 flex items-center gap-1">
        {label}
        {tooltip && (
          <CustomTooltip content={tooltip}>
            <QuestionMarkCircledIcon className="text-gray-400 cursor-pointer" />
          </CustomTooltip>
        )}
      </span>
      {displayType === DisplayType.TEXT && (
        <span className={commonTextClasses}>{value}</span>
      )}
      {displayType === DisplayType.LINK && (
        <Link
          to={link}
          className={`${commonTextClasses} text-primary-600 text-primary cursor-pointer hover:opacity-80`}
        >
          {value.startsWith("0x") ? truncateHashString(value) : value}
          <span className="ml-1">🔗</span>
        </Link>
      )}
      {displayType === DisplayType.HEX && (
        <span className={commonTextClasses}>
          <CopyableText
            text={
              value.startsWith("0x") && !value.includes(", ")
                ? truncateHashString(value)
                : value
            }
            toCopy={value}
            additionalClassesIcon="justify-end"
          />
        </span>
      )}
      {displayType === DisplayType.EXTERNAL_LINK && (
        <a
          href={extLink}
          target="_blank"
          rel="noreferrer"
          className={`${commonTextClasses} text-primary-600 text-primary cursor-pointer hover:opacity-80`}
        >
          {value}
          <span className="ml-1">↗️</span>
        </a>
      )}
      {displayType === DisplayType.TEXTAREA && (
        <CopyableText text={value} toCopy={value} textArea />
      )}
      {displayType === DisplayType.BADGE && (
        <div className={commonTextClasses}>
          <BlockStatusBadge status={Number(value)} />
        </div>
      )}
    </div>
  );
};
