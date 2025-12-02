import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import { BaseLayout } from "~/layout/base-layout";
import { routes } from "~/routes/__root";

export const AboutUs: FC = () => {
  return (
    <BaseLayout>
      <div className="flex flex-col items-center">
        <h1>About Us</h1>
        <div className="bg-white w-full rounded-lg shadow-md p-6 md:p-8 md:w-3/4 lg:w-2/3 max-w-4xl">
          <p className="mb-4">
            We believe private-by-default blockchains will matter as much as the
            shift from Web2 to Web3 itself. Web2 showed what happens when trust
            is centralised and privacy becomes something you trade away. Now
            that we know better, it is time to build better. Aztec unlocks a
            world where privacy and verifiability can coexist, and where onchain
            activity can finally feel human again. But none of this matters
            without adoption. And adoption starts with trust.
          </p>
          <p className="mb-4">
            The thing is, trust cannot be marketed. It has to be earned.
          </p>
          <p className="mb-4">
            For us, that means only building where we see purpose and long-term
            value. We have spent years in the real-world trenches of privacy
            technology. Writing Circom circuits for global supply chains.
            Working across networks like Aleo and Oasis. Learning how people
            actually use these systems, and where they fail. Trust begins with
            people, long before it becomes something a protocol can hold.
          </p>
          <p className="mb-4">
            This is why we chose Aztec. From the start we saw a team focused on
            shipping rather than noise. Their values match how we work. Quiet.
            Consistent. Long-term. We have been in crypto since 2017 and remain
            convinced that Ethereum is where real adoption will happen. Aztec is
            where privacy, credibility and long-term execution meet, and where
            our experience can make a meaningful contribution.
          </p>
          <p className="mb-4">
            Aztec-Scan is our first major contribution. A public good built to
            make Aztec understandable without compromising the privacy it stands
            for. Everything we build is open source. Everything is designed so
            developers, wallets and communities can build on top of it with
            confidence.
          </p>
          <p className="mb-4">
            We are selective in the work we take on. We want to build alongside
            people and protocols whose values align with ours. When that
            alignment is real, we give everything. When it is not, we step
            aside.
          </p>
          <p className="mb-6">
            Honestly, we do not yet know exactly how privacy-preserving
            blockchains will change the world. No one does. But we think it is
            damn well worth being there to shape it, with our heads in the
            clouds and our feet firmly on the ground. Because Web3 is simply too
            valuable to be used carelessly. This is the future we are forging,
            after all.
          </p>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center">
              <Link
                to={routes.staking.route}
                className="text-purple-light hover:font-bold text-lg"
              >
                Support Aztec-Scan by delegating stake to us →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};
