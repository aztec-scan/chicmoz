import { Link } from "@tanstack/react-router";
import { DiscordIcon, GithubIcon } from "~/assets";
import { ChicmozHomeLink } from "~/components/ui/chicmoz-home-link";
import { routes } from "~/routes/__root";
import { DISCORD_URL, GITHUB_URL } from "~/service/constants";

export const Footer = () => {
  return (
    <footer className="pt-20">
      <Strips />
      <div className="bg-purple-light py-10">
        <div className="mx-auto px-[70px] max-w-[1440px]">
          <div className="flex flex-col w-full">
            <div className="flex flex-col w-full items-center lg:items-end lg:text-center lg:flex-row">
              <ChicmozHomeLink className="hidden lg:mr-auto lg:block opacity-75 hover:opacity-100" />
              <ChicmozHomeLink className="lg:hidden mb-[20px] opacity-75 hover:opacity-100" />
              <div className="mx-auto flex items-center lg:flex-row flex-col">
                <Link
                  to={routes.aboutUs.route}
                  className="[&.active]:text-white mr-0 mb-[40px] lg:mb-0 lg:mr-[30px]  text-grey-light hover:text-white"
                >
                  {routes.aboutUs.title}
                </Link>
                <Link
                  to={routes.privacyPolicy.route}
                  className="[&.active]:text-white mr-0 mb-[40px] lg:mb-0 lg:mr-[30px]  text-grey-light hover:text-white"
                >
                  {routes.privacyPolicy.title}
                </Link>
                <Link
                  to={routes.termsAndConditions.route}
                  className="[&.active]:text-white mr-0 mb-[100px] lg:mb-0 lg:mr-[30px]  text-grey-light hover:text-white"
                >
                  {routes.termsAndConditions.title}
                </Link>
              </div>
              <div className="flex flex-row gap-5 lg:gap-0 lg:ml-auto">
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  className="mx-auto opacity-75 hover:opacity-100"
                >
                  <DiscordIcon className="size-3/4" />
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  className="mx-auto opacity-75 hover:opacity-100"
                >
                  <GithubIcon className="size-3/4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const text = {
  aboutUs: "About Us",
  privacyPolicy: "Privacy Policy",
  joinOurDiscord: "Join our Discord",
  termsAndConditions: "Terms and Conditions",
};

const Strips = () => {
  return (
    <>
      <hr className="border-purple-light border-[1.5px]" />
      <hr className="border-grey-light border-[7.8px]" />
      <hr className="border-purple-light border-[2.7px]" />
      <hr className="border-grey border-[6.5px]" />
      <hr className="border-purple-light border-4" />
      <hr className="border-grey border-[5.2px]" />
      <hr className="border-purple-light border-[5.2px]" />
      <hr className="border-grey border-4" />
      <hr className="border-purple-light border-[6.5px]" />
      <hr className="border-grey border-[2.7px]" />
      <hr className="border-purple-light border-[7.8px]" />
      <hr className="border-grey border-[1.5px]" />
    </>
  );
};
