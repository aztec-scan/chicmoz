import { CopyIcon } from "@radix-ui/react-icons";
import { type FC } from "react";
import { toast } from "sonner";

interface CopyableJsonProps {
  data: unknown;
}

export const CopyableJson: FC<CopyableJsonProps> = ({ data }) => {
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    try {
      void navigator.clipboard.writeText(jsonString);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="relative">
      <pre className="overflow-auto bg-gray-50 p-5 rounded-md pr-12">
        {jsonString}
      </pre>
      <CopyIcon
        className="absolute top-3 right-3 cursor-pointer hover:opacity-80 dark:text-gray-600"
        onClick={handleCopy}
      />
    </div>
  );
};
