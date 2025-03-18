import { Link } from "@tanstack/react-router";
import { AztecIconThemed } from "~/assets";
import { routes } from "~/routes/__root";
import { APP_NAME } from "~/service/constants";

export function ChicmozHomeLink({
  className = "",
  textClasses = "",
  iconClasses = "",
}) {
  return (
    <div className={className}>
      <Link to={routes.home.route} className="flex flex-row items-center">
        <AztecIconThemed className={iconClasses} />
        <p
          className={`${textClasses} text-white dark:text-[#1f2937] ml-1 font-bold text-[24px] font-space-grotesk`}
        >
          {APP_NAME}
        </p>
      </Link>
    </div>
  );
}
