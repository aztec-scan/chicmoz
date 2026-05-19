import { type FC, useEffect, useMemo, useRef, useState } from "react";
import { CHICMOZ_ALL_UI_URLS, L2_NETWORK_ID } from "~/service/constants";

const normalizeNetworkName = (name: string): string => name.trim().toUpperCase();

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  const fixedSingleSlashScheme = trimmed.replace(
    /^([a-z][a-z\d+.-]*:)\/(?!\/)/i,
    "$1//",
  );
  const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(fixedSingleSlashScheme);
  const absoluteUrl = hasScheme
    ? fixedSingleSlashScheme
    : `${window.location.protocol}//${fixedSingleSlashScheme}`;

  return absoluteUrl.replace(/\/$/, "");
};

const preserveCurrentPath = (baseUrl: string): string => {
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `${normalizeUrl(baseUrl)}${path}`;
};

export const NetworkSelector: FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentNetwork = normalizeNetworkName(L2_NETWORK_ID ?? "MAINNET");

  const networks = useMemo(
    () =>
      CHICMOZ_ALL_UI_URLS.map(({ name, url }) => ({
        name: normalizeNetworkName(name),
        url: normalizeUrl(url),
      })).filter(({ name, url }) => name.length > 0 && url.length > 0),
    [],
  );

  const hasMultipleNetworks = networks.length > 1;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleDocClick = (event: MouseEvent) => {
      if (
        ref.current &&
        event.target instanceof Node &&
        !ref.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const switchNetwork = (url: string) => {
    window.location.assign(preserveCurrentPath(url));
  };

  if (!hasMultipleNetworks) {
    return <div className="brand-env">{currentNetwork}</div>;
  }

  return (
    <div className="network-selector" ref={ref}>
      <button
        type="button"
        className={`brand-env network-trigger${open ? " on" : ""}`}
        aria-label="Select Aztec network"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{currentNetwork}</span>
        <span className="network-caret">▾</span>
      </button>
      {open ? (
        <div className="network-dropdown" role="menu">
          {networks.map((network) => {
            const isActive = network.name === currentNetwork;
            return (
              <button
                key={`${network.name}-${network.url}`}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className={`network-option${isActive ? " active" : ""}`}
                onClick={() => {
                  if (isActive) {
                    setOpen(false);
                    return;
                  }
                  switchNetwork(network.url);
                }}
              >
                <span className="network-dot" />
                <span>{network.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
