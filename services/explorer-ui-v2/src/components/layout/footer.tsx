import { Link } from "@tanstack/react-router";
import { type FC } from "react";

const YEAR = new Date().getFullYear();

/** Quiet footer with legal + about links; lives at the bottom of every page. */
export const Footer: FC = () => (
  <footer className="footer">
    <div className="footer-links">
      <Link to="/about-us">About</Link>
      <span className="sep">·</span>
      <Link to="/privacy-policy">Privacy</Link>
      <span className="sep">·</span>
      <Link to="/terms-and-conditions">Terms</Link>
      <span className="sep">·</span>
      <a
        href="https://github.com/aztec-scan/chicmoz"
        target="_blank"
        rel="noreferrer"
      >
        GitHub ↗
      </a>
    </div>
    <div className="footer-copy">
      © {YEAR} Aztec-Scan · open-source block explorer for Aztec
    </div>
  </footer>
);
