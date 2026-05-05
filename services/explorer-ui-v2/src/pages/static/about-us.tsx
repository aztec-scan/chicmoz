import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import { StaticPage } from "./static-page";

export const AboutUsPage: FC = () => (
  <StaticPage
    slug="about-us"
    title="About us"
    comment="who we are and why we build Aztec-Scan"
  >
    <p>
      We believe private-by-default blockchains will matter as much as the
      shift from Web2 to Web3 itself. Web2 showed what happens when trust is
      centralized and privacy becomes something you trade away. Now that we
      know better, it is time to build better. Aztec unlocks a world where
      privacy and verifiability can coexist, and where onchain activity can
      finally feel human again. But none of this matters without adoption. And
      adoption starts with trust.
    </p>
    <p>The thing is, trust cannot be marketed. It has to be earned.</p>
    <p>
      For us, that means only building where we see purpose and long-term
      value. We have spent years in the real-world trenches of privacy
      technology. Writing Circom circuits for global supply chains. Working
      across networks like Aleo and Oasis. Learning how people actually use
      these systems, and where they fail. Trust begins with people, long before
      it becomes something a protocol can hold.
    </p>
    <p>
      This is why we chose Aztec. From the start we saw a team focused on
      shipping rather than noise. Their values match how we work. Quiet.
      Consistent. Long-term. We have been in crypto since 2017 and remain
      convinced that Ethereum is where real adoption will happen. Aztec is
      where privacy, credibility and long-term execution meet, and where our
      experience can make a meaningful contribution.
    </p>
    <p>
      Aztec-Scan is our first major contribution. A public good built to make
      Aztec understandable without compromising the privacy it stands for.
      Everything we build is open source. Everything is designed so developers,
      wallets and communities can build on top of it with confidence.
    </p>
    <p>
      We are selective in the work we take on. We want to build alongside
      people and protocols whose values align with ours. When that alignment is
      real, we give everything. When it is not, we step aside.
    </p>
    <p>
      Honestly, we do not yet know exactly how privacy-preserving blockchains
      will change the world. No one does. But we think it is damn well worth
      being there to shape it, with our heads in the clouds and our feet firmly
      on the ground. Because Web3 is simply too valuable to be used carelessly.
      This is the future we are forging, after all.
    </p>
    <div className="static-cta">
      <Link to="/staking" className="cta-primary">
        <span>Support Aztec-Scan by delegating to us</span>
        <span className="arrow">→</span>
      </Link>
    </div>
  </StaticPage>
);
