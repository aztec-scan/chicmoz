/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import https from "https";
import { fileURLToPath } from "url";
import artifactJson from "../../target/explorer_showcase-ExplorerShowcase.json" with { type: "json" };
import { logger } from "../../../../logger.js";

const ADDRESS =
  "0x11974ff4e89d32e1d84de5a9c4e728fb747143342ff1a7711ce781d3e298bfd4";

const TARGET_URL = `https://api.testnet.aztecscan.xyz/v1/temporary-api-key/l2/contract-instances/${ADDRESS}`;

const body = {
  deployerMetadata: {
    contractIdentifier: "ExplorerShowcase",
    details: "AztecScan ExplorerShowcase contract deployed on testnet",
    creatorName: "AztecScan",
    creatorContact: "admin@aztecscan.xyz",
    appUrl: "https://testnet.aztecscan.xyz",
    repoUrl: "https://github.com/aztec-scan/chicmoz",
    contractType: "showcase",
  },
  verifiedDeploymentArguments: {
    salt: "0x105e2adc9d592a016535a7115be75e03b23c1e5f815015d813f49a5c3da74634",
    deployer:
      "0x2231c82a5518622b4b70e367730ed784848f8f8b9ca32b154a6b5a826760a0f7",
    publicKeysString:
      "0x01498945581e0eb9f8427ad6021184c700ef091d570892c437d12c7d90364bbd170ae506787c5c43d6ca9255d571c10fa9ffa9d141666e290c347c5c9ab7e34400c044b05b6ca83b9c2dbae79cc1135155956a64e136819136e9947fe5e5866c1c1f0ca244c7cd46b682552bff8ae77dea40b966a71de076ec3b7678f2bdb1511b00316144359e9a3ec8e49c1cdb7eeb0cedd190dfd9dc90eea5115aa779e287080ffc74d7a8b0bccb88ac11f45874172f3847eb8b92654aaa58a3d2b8dc7833019c111f36ad3fc1d9b7a7a14344314d2864b94f030594cd67f753ef774a1efb2039907fe37f08d10739255141bb066c506a12f7d1e8dfec21abc58494705b6f",
    constructorArgs: [
      "0x2231c82a5518622b4b70e367730ed784848f8f8b9ca32b154a6b5a826760a0f7",
    ],
    stringifiedArtifactJson: JSON.stringify(artifactJson),
  },
  aztecScanNotes: {
    name: "ExplorerShowcase",
    origin: "Aztecscan",
    comment:
      "A showcase contract deployed on the Aztec testnet to demonstrate and test all explorer functionalities, including private functions, public state, events, and contract interactions.",
  },
};

export async function run() {
  logger.info("===== VERIFY CONTRACT INSTANCE DEPLOYMENT (ExplorerShowcase) =====");
  logger.info(`address:  ${ADDRESS}`);
  logger.info(`url:      ${TARGET_URL}`);

  const postData = JSON.stringify(body);
  const sizeInMB = Buffer.byteLength(postData) / 1000 ** 2;
  logger.info(`payload:  ${sizeInMB.toFixed(2)} MB`);

  const url = new URL(TARGET_URL);

  const res = await new Promise<{
    statusCode: number | undefined;
    statusMessage: string | undefined;
    data: string;
  }>((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            data,
          });
        });
      },
    );

    req.on("error", reject);

    const timeoutMs = Math.max(60000, sizeInMB * 10000);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });

    req.write(postData);
    req.end();
  });

  logger.info(
    `Response: ${JSON.stringify({
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      data: res.data,
    })}`,
  );

  if (
    res.statusCode === 200 ||
    res.statusCode === 201 ||
    res.statusCode === 202
  ) {
    logger.info("SUCCESS");
  } else {
    throw new Error(
      `Failed: ${res.statusCode} ${res.statusMessage} — ${res.data}`,
    );
  }

  logger.info("===== DONE =====");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void run();
}
