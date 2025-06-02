import { CopyIcon } from "@radix-ui/react-icons";
import { type FC } from "react";
import { toast } from "sonner";
import { Textarea } from "./ui/textarea";

interface Props {
  additionalClasses?: string;
  additionalClassesIcon?: string;
  toCopy: string;
  text: string;
  textArea?: boolean;
}

export const CopyableText: FC<Props> = ({
  additionalClasses,
  additionalClassesIcon,
  toCopy,
  textArea = false,
  text,
}) => {
  const handleCopy = () => {
    try {
      void navigator.clipboard.writeText(toCopy);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className={`flex w-full ${additionalClasses}`}>
      <div
        className={`flex w-full flex-row gap-2 items-center ${additionalClassesIcon}`}
      >
        {textArea ? (
          <Textarea className="text-sm flex-grow" value={text} readOnly />
        ) : (
          <span className="relative inline-block font-mono dark:text-white">
            {text}
          </span>
        )}
        <CopyIcon
          className="cursor-pointer hover:opacity-80 dark:text-gray-300"
          onClick={handleCopy}
        />
      </div>
    </div>
  );
};
