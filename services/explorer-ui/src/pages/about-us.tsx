import { type FC } from "react";
import { BaseLayout } from "~/layout/base-layout";
import { DISCORD_URL } from "~/service/constants";

export const AboutUs: FC = () => {
  return (
    <BaseLayout>
      <div className="flex flex-col items-center">
        <h1>About Us</h1>
        <div className="bg-white w-full rounded-lg shadow-md p-4 md:w-1/2">
          <p>
            We are a team of developers and designers who are passionate about
            privacy on the internet. We have been building in the crypto space
            for over 5 years and have a deep understanding of the technology and
            the community.
          </p>
          <br />
          <p>
            Easiest way to connect with us is to join our{" "}
            <a href={DISCORD_URL} className="text-purple-light hover:font-bold">
              Discord server
            </a>
            .
          </p>
        </div>
      </div>
    </BaseLayout>
  );
};
