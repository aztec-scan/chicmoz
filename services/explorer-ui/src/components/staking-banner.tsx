import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { routes } from "~/routes/__root";

const STORAGE_KEY = "staking-banner-dismissed";

export const StakingBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    setIsVisible(!isDismissed);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mx-auto px-4 max-w-[1440px] md:px-[70px] mt-4">
      <div className="bg-accent border border-border border-red rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-foreground">
              Support Aztec-Scan by staking AZTEC to us
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Help us keep Aztec-Scan running and support the Aztec network by
          delegating your AZTEC tokens to our validator. Your stake helps us
          maintain and improve the explorer for the community.{" "}
          <Link
            to={routes.staking.route}
            className="text-purple-light hover:underline"
          >
            Learn more about delegating stake to Aztec-Scan
          </Link>
          .
        </p>
      </div>
    </div>
  );
};
