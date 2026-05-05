import { type FC } from "react";
import { StaticPage } from "./static-page";

export const TermsAndConditionsPage: FC = () => (
  <StaticPage
    slug="terms"
    title="Terms and conditions"
    comment="legal disclaimer"
  >
    <p>
      Chicmoz is an open-source project that aims to provide live network data
      and a high uptime. However, Chicmoz offers no guarantees on data
      availability or accuracy and cannot be held legally accountable for it.
    </p>
  </StaticPage>
);
