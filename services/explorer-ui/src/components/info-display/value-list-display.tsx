import { type FC } from "react";
import { CopyableText } from "../copy-text";

interface ValueListDisplayProps {
  title: string;
  values: string[];
}

export const ValueListDisplay: FC<ValueListDisplayProps> = ({
  title,
  values,
}) => (
  <div>
    <h3>{title}</h3>
    <div>
      {values.map((value, index) => (
        <div
          key={value}
          className={`flex items-center justify-end py-3 ${
            index !== values.length - 1
              ? "border-b border-gray-200 dark:border-gray-700"
              : ""
          }`}
        >
          <CopyableText
            text={value}
            toCopy={value}
            additionalClasses="break-all font-mono text-end"
            additionalClassesIcon="justify-end"
          />
        </div>
      ))}
    </div>
  </div>
);
