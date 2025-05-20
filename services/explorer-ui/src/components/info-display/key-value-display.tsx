import { type FC } from "react";
import { KeyValueRow } from "./key-value-row";

export interface DetailItem {
  label: string;
  timestamp?: number;
  value?: string;
  link?: string;
  extLink?: string;
  tooltip?: string;
  customValue?: JSX.Element;
}

interface KeyValueDisplayProps {
  data: DetailItem[];
}

export const KeyValueDisplay: FC<KeyValueDisplayProps> = ({ data }) => (
  <>
    {data.map((item, index) => (
      <KeyValueRow
        key={index}
        timestamp={item.timestamp}
        label={item.label}
        value={item.value}
        isLast={index === data.length - 1}
        link={item.link}
        extLink={item.extLink}
        tooltip={item.tooltip}
        customValue={item.customValue ?? <></>}
      />
    ))}
  </>
);
