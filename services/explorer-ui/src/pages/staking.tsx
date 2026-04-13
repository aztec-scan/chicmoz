import { type FC } from "react";
import { BaseLayout } from "~/layout/base-layout";

export const Staking: FC = () => {
  return (
    <BaseLayout>
      <div className="flex flex-col items-center">
        <h1>Stake to Aztec-Scan</h1>
        <div className="bg-white w-full rounded-lg shadow-md p-6 md:p-8 md:w-3/4 lg:w-2/3 max-w-4xl">
          <section className="mb-8">
            <p className="text-lg">
              We provide Aztec-Scan services free of charge and open source. Our
              mission is to benefit the entire Aztec ecosystem by building tools
              that everyone can use and contribute to. The best way you can
              support us is by delegating your $AZTEC to our Sequencer. This will
              help us maintain and improve Aztec-Scan while contributing to the
              security and decentralization of the Aztec network.
            </p>
          </section>

          <section className="mb-8">
            <p className="text-lg">
              We run our infrastructure with the highest industry standards.{" "}
              <a
                href="https://dashtec.xyz/providers/4"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-light hover:text-purple-dark underline"
              >
                View our performance metrics on Dashtec
              </a>{" "}
              to see our commitment to reliability and excellence.
            </p>
          </section>

          <div className="mt-8 flex justify-center">
            <a
              href="https://stake.aztec.network/providers/4"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-purple-light text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-dark transition-colors text-center"
            >
              Stake your $AZTEC
            </a>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};
