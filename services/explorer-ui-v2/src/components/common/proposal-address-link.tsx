import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { type FC } from "react";

interface Props {
  content: string;
  payloadAddress: string;
  className?: string;
  showExternalLinkIcon?: boolean;
  title?: string;
}

export const ProposalAddressLink: FC<Props> = ({
  content,
  payloadAddress,
  className,
  showExternalLinkIcon = false,
  title = "View proposal details",
}) => {
  const cls = `proposal-link${className ? ` ${className}` : ""}`;

  return (
    <Link
      to="/governance/proposal/$payloadAddress"
      params={{ payloadAddress }}
      className={cls}
      title={title}
      aria-label={title}
    >
      <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
        {content}
        {showExternalLinkIcon ? <ExternalLink size={12} aria-hidden /> : null}
      </span>
    </Link>
  );
};
