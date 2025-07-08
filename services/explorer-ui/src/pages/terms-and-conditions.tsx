import { type FC } from "react";
import { BaseLayout } from "~/layout/base-layout";

export const TermsAndCondtions: FC = () => {
  return (
    <BaseLayout>
      <div className="flex flex-col items-center">
        <h1>Terms and Conditions</h1>
        <div className="bg-white w-full rounded-lg shadow-md p-4 md:w-1/2">
          <p>
            Chicmoz is an opensource project that aims to provide live network
            data and a high uptime. However, Chicmoz offers no guarantees on
            data availability or accuracy and can not be held legally
            accountable for it.
          </p>
        </div>
      </div>
    </BaseLayout>
  );
};
