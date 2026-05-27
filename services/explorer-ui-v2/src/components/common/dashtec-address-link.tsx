import { ExternalLink } from "lucide-react";
import { type FC } from "react";

interface Props {
  address: string;
  content?: string;
  className?: string;
  showExternalLinkIcon?: boolean;
  title?: string;
}

const DASHTEC_URL = "https://dashtec.xyz";

export const DashtecAddressLink: FC<Props> = ({
  address,
  content,
  className,
  showExternalLinkIcon = true,
  title = "View on Dashtec",
}) => {
  const display = content ?? address;
  const cls = `dashtec-link${className ? ` ${className}` : ""}`;

  return (
    <a
      href={`${DASHTEC_URL}/sequencers/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cls}
      title={title}
      aria-label={title}
    >
      <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
        {display}
        {showExternalLinkIcon ? <ExternalLink size={12} aria-hidden /> : null}
      </span>
    </a>
  );
};
