import { type FC, type ReactNode } from "react";
import { ConsoleHead, Shell } from "~/components/layout";

interface Props {
  /** Slug label shown in the breadcrumb (e.g. "about-us"). */
  slug: string;
  /** Large heading at the top of the prose body. */
  title: string;
  /** Optional one-line subtitle, e.g. "Last updated YYYY-MM-DD". */
  subtitle?: string;
  /** Trailing comment after the `//` in the breadcrumb. */
  comment?: ReactNode;
  children: ReactNode;
}

/** Shared layout for content-only pages (about, privacy, terms). */
export const StaticPage: FC<Props> = ({
  slug,
  title,
  subtitle,
  comment,
  children,
}) => (
  <Shell>
    <ConsoleHead
      crumbs={[
        { label: "aztec-scan", to: "/" },
        { label: slug, active: true },
      ]}
      comment={comment}
    />
    <article className="static-page">
      <header className="static-page-head">
        <h1>{title}</h1>
        {subtitle && <div className="sub">{subtitle}</div>}
      </header>
      <div className="static-page-body">{children}</div>
    </article>
  </Shell>
);
