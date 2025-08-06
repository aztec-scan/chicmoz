import { X } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "validator-survey-banner-dismissed";

export const ValidatorSurveyBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    setIsVisible(!isDismissed);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="mx-auto px-4 max-w-[1440px] md:px-[70px] mt-4">
      <div className="bg-lime-100 border rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-blue-900">
              Help shape validator profiles
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-blue-500 hover:text-blue-700 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-2 text-sm ">
          We're building validator profiles to increase transparency and help
          validators attract more stake. Your input is important to us!{" "}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSeosqjGE7BUEbhb1OUiwDQLXP1Z6HSmW-so4ULf3_tqKdR4Qw/viewform?usp=dialog"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-light hover:underline"
          >
            Please take a moment to do our 2 minutes survey.
          </a>
        </p>
      </div>
    </div>
  );
};
