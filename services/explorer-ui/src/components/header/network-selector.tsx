import { Link } from "@tanstack/react-router";
import { routes } from "~/routes/__root.tsx";
import { CHICMOZ_ALL_UI_URLS, L2_NETWORK_ID } from "~/service/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface NetworkSelectorProps {
  className?: string;
}

export const NetworkSelector = ({ className = "" }: NetworkSelectorProps) => {
  const handleNetworkChange = (url: string) => {
    // Preserve current path when switching networks
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = url + currentPath;
  };

  // If no networks configured or only one network, show as plain text
  const hasMultipleNetworks = CHICMOZ_ALL_UI_URLS.length > 1;

  if (!hasMultipleNetworks) {
    return (
      <Link to={routes.dev.route} className={className}>
        <span className="font-space-grotesk text-white">{L2_NETWORK_ID}</span>
      </Link>
    );
  }

  return (
    <Select onValueChange={handleNetworkChange}>
      <SelectTrigger
        className={`${className} w-auto border-none bg-transparent font-space-grotesk text-white shadow-none focus:ring-0 focus:ring-offset-0 h-auto p-0 gap-1 [&>svg]:opacity-100 [&>svg]:text-white`}
      >
        <SelectValue placeholder={L2_NETWORK_ID} />
      </SelectTrigger>
      <SelectContent className="bg-purple-dark border-purple-light">
        {CHICMOZ_ALL_UI_URLS.map((network) => (
          <SelectItem
            key={network.url}
            value={network.url}
            className="text-white focus:bg-purple-light focus:text-white cursor-pointer"
          >
            {network.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
