import { CustomTooltip } from "~/components/custom-tooltip";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "~/components/ui";

export type OptionItem = {
  id: string;
  label: string;
};

export type OptionItems = OptionItem[];

type ExtractOptionId<T extends OptionItems> = T[number]["id"];

type OptionButtonProps<T extends OptionItems> = {
  options: T;
  availableOptions: Record<string, boolean>; // TODO: this should work: Record<ExtractOptionId<T>, boolean>
  onOptionSelect: (option: ExtractOptionId<T>) => void;
  selectedItem: ExtractOptionId<T>;
};

const withAvailableTooltip = (
  isAvailable: boolean,
  key: number,
  children: React.ReactNode,
) => {
  // TODO: refactor to use CustomTooltip component instead?
  if (!isAvailable) {
    return (
      <CustomTooltip key={key} content="Not available">
        {children}
      </CustomTooltip>
    );
  }

  return <div key={key}>{children}</div>;
};

export const OptionButtons = <T extends OptionItems>({
  options,
  availableOptions,
  onOptionSelect,
  selectedItem,
}: OptionButtonProps<T>) => {
  // Check if any options are available
  const hasAnyAvailableOptions = Object.values(availableOptions).some(Boolean);
  
  return (
    <>
      <div className="hidden lg:flex flex-row gap-4 mb-4 justify-center">
        {options.map((option, key) => {
          const isAvailable = availableOptions[option.id];
          return withAvailableTooltip(
            isAvailable,
            key,
            <div className="flex flex-col justify-center items-center gap-1">
              <Button
                key={key}
                onClick={() => onOptionSelect(option.id)}
                disabled={!isAvailable}
                variant="default"
                className="hover:bg-slate-500 border border-input"
              >
                {option.label}
              </Button>
              {hasAnyAvailableOptions && selectedItem === option.id && (
                <Separator className="h-0.5 bg-gray-700 w-1/2" />
              )}
            </div>,
          );
        })}
      </div>
      <div className="mb-1 mt-4 lg:hidden">
        <Select onValueChange={onOptionSelect} value={selectedItem}>
          <SelectTrigger className="h-8 w-3/5 bg-primary text-white">
            <SelectValue placeholder={selectedItem} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option, key) => (
              <SelectItem
                key={key}
                disabled={!availableOptions[option.id]}
                value={option.id}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
