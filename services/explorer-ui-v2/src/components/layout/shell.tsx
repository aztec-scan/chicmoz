import { type FC, type ReactNode } from "react";
import { Footer } from "./footer";
import { TopBar, type TopBarActive } from "./top-bar";

interface Props {
  active?: TopBarActive;
  children: ReactNode;
}

/** Every page is wrapped in a `.shell` container with a fixed `TopBar` on top. */
export const Shell: FC<Props> = ({ active, children }) => (
  <div className="shell">
    <TopBar active={active} />
    {children}
    <Footer />
  </div>
);
