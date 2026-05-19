import { Link } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import {
  type FC,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { searchL2Api } from "~/api";
import { useChainHealth } from "~/hooks/use-chain-health";
import {
  type ResponsiveBreakpoint,
  useResponsiveNavItems,
} from "~/hooks/use-responsive-nav-items";
import { getSingleSearchDestination } from "~/lib/search-results";
import { BrandLogo } from "./brand-logo";
import { NetworkSelector } from "./network-selector";

export type TopBarActive =
  | "home"
  | "blocks"
  | "txs"
  | "contracts"
  | "validators"
  | "ecosystem"
  | "l1events"
  | "staking"
  | "health";

interface Props {
  active?: TopBarActive;
}

type NavGroup = "main" | "aztec" | "dev";

interface NavItem {
  key: string;
  label: string;
  to: string;
  /** Group the item belongs to in the More-menu dropdown. */
  group: NavGroup;
  /** Opens in a new tab with href instead of router `Link`. */
  external?: boolean;
}

const DOCS_URL = "https://docs.aztecscan.xyz/";

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", to: "/", group: "main" },
  { key: "blocks", label: "Blocks", to: "/blocks", group: "main" },
  { key: "txs", label: "Txs", to: "/tx-effects", group: "main" },
  { key: "contracts", label: "Contracts", to: "/contracts", group: "main" },
];

const MORE_NAV_ITEMS: NavItem[] = [
  { key: "ecosystem", label: "Ecosystem", to: "/ecosystem", group: "aztec" },
  { key: "validators", label: "Validators", to: "/validators", group: "aztec" },
  {
    key: "l1events",
    label: "L1 Contract Events",
    to: "/l1/contract-events",
    group: "aztec",
  },
  { key: "staking", label: "Staking", to: "/staking", group: "dev" },
  {
    key: "fee-recipients",
    label: "Fee Recipients",
    to: "/fee-recipients",
    group: "dev",
  },
  {
    key: "docs",
    label: "API Docs",
    to: DOCS_URL,
    group: "dev",
    external: true,
  },
];

/** Primary nav collapses right-to-left into the More menu as the viewport shrinks. */
const BREAKPOINTS: ResponsiveBreakpoint[] = [
  { maxWidth: 560, visible: 0 },
  { maxWidth: 720, visible: 1 },
  { maxWidth: 900, visible: 2 },
  { maxWidth: 1100, visible: 3 },
];

const SunIcon: FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
    <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="12" y1="2.5" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="21.5" y2="12" />
      <line x1="5" y1="5" x2="6.8" y2="6.8" />
      <line x1="17.2" y1="17.2" x2="19" y2="19" />
      <line x1="5" y1="19" x2="6.8" y2="17.2" />
      <line x1="17.2" y1="6.8" x2="19" y2="5" />
    </g>
  </svg>
);

const SystemIcon: FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect
      x="3"
      y="4"
      width="18"
      height="13"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <line
      x1="8"
      y1="20.5"
      x2="16"
      y2="20.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <line
      x1="12"
      y1="17"
      x2="12"
      y2="20.5"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

const MoonIcon: FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

export const TopBar: FC<Props> = ({ active = "home" }) => {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { label: statusLabel, dotClass, reason: statusReason } = useChainHealth();
  const { theme, setTheme } = useTheme();

  const { primaryVisible, primaryOverflow } = useResponsiveNavItems(
    PRIMARY_NAV_ITEMS,
    BREAKPOINTS,
  );

  /** Dropdown items grouped in source order by `group`. */
  const dropdownGroups: { group: NavGroup; items: NavItem[] }[] =
    useMemo(() => {
      const all = [...primaryOverflow, ...MORE_NAV_ITEMS];
      const order: NavGroup[] = ["main", "aztec", "dev"];
      return order
        .map((g) => ({ group: g, items: all.filter((i) => i.group === g) }))
        .filter((entry) => entry.items.length > 0);
    }, [primaryOverflow]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleDocClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        e.target instanceof Node &&
        !menuRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleSearchShortcut = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const { activeElement } = document;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement instanceof HTMLElement &&
          activeElement.isContentEditable);

      if (isTyping) {
        return;
      }

      e.preventDefault();
      searchInputRef.current?.focus();
    };

    document.addEventListener("keydown", handleSearchShortcut);
    return () => {
      document.removeEventListener("keydown", handleSearchShortcut);
    };
  }, []);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) {
      return;
    }

    try {
      const searchResults = await searchL2Api.search(q);
      const singleDestination = getSingleSearchDestination(
        searchResults.results,
      );
      if (singleDestination) {
        window.location.assign(singleDestination.href);
        return;
      }
    } catch {
      // Let the search page own error presentation for failed searches.
    }

    window.location.assign(`/search?q=${encodeURIComponent(q)}`);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSearch();
  };

  const moreActive = dropdownGroups
    .flatMap((g) => g.items)
    .some((i) => i.key === active);

  const currentTheme = theme ?? "system";

  return (
    <div className="topbar">
      <Link to="/" className="brand">
        <div className="brand-mark">
          <BrandLogo />
        </div>
        <div className="brand-wm">
          aztec<em>·</em>scan
        </div>
      </Link>
      <NetworkSelector />

      <Link
        to="/health"
        className={`chainpill ${
          dotClass === "dot"
            ? ""
            : dotClass === "dot unknown"
              ? "unknown"
            : dotClass === "dot warn"
              ? "unhealthy"
              : "down"
        }`}
        title={`Open chain health · ${statusReason}`}
      >
        <span className={`dot pulse`} />
        <span>{statusLabel}</span>
      </Link>

      <form className="search" onSubmit={onSubmit}>
        <span className="prompt">{"›"}</span>
        <input
          ref={searchInputRef}
          placeholder="search block height · hash · tx · contract · class · address…"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="hint">/</span>
      </form>

      <nav className="topnav">
        {primaryVisible.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className={active === item.key ? "active" : ""}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="more-menu" ref={menuRef}>
        <button
          type="button"
          className={`more-btn${moreActive ? " active" : ""}${
            menuOpen ? " on" : ""
          }`}
          aria-label="More navigation"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="burger">
            <span />
            <span />
            <span />
          </span>
        </button>
        {menuOpen && (
          <div className="more-dropdown" role="menu">
            {dropdownGroups.map((section) => (
              <div className="dd-section" key={section.group}>
                {section.items.map((item) =>
                  item.external ? (
                    <a
                      key={item.key}
                      href={item.to}
                      target="_blank"
                      rel="noreferrer"
                      role="menuitem"
                      className="dd-link external"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                      <span className="ext">↗</span>
                    </a>
                  ) : (
                    <Link
                      key={item.key}
                      to={item.to}
                      role="menuitem"
                      className={`dd-link${
                        active === item.key ? " active" : ""
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ),
                )}
              </div>
            ))}

            <div className="dd-section">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={currentTheme === "light"}
                className={`dd-theme-btn${
                  currentTheme === "light" ? " active" : ""
                }`}
                onClick={() => setTheme("light")}
              >
                <SunIcon />
                <span>Light</span>
              </button>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={currentTheme === "dark"}
                className={`dd-theme-btn${
                  currentTheme === "dark" ? " active" : ""
                }`}
                onClick={() => setTheme("dark")}
              >
                <MoonIcon />
                <span>Dark</span>
              </button>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={currentTheme === "system"}
                className={`dd-theme-btn${
                  currentTheme === "system" ? " active" : ""
                }`}
                onClick={() => setTheme("system")}
              >
                <SystemIcon />
                <span>System</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
