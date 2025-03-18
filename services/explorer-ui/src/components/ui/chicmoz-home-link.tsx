import { Link } from "@tanstack/react-router";
import { AztecIconWhite } from "~/assets";
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
        <AztecIconWhite className={iconClasses} />
        <p
          className={`${textClasses} text-white ml-1 font-bold text-[24px] font-space-grotesk`}
        >
          {APP_NAME}
        </p>
      </Link>
    </div>
  );
}
