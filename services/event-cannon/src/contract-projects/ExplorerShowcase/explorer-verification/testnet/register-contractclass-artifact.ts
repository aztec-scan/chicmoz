/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import https from "https";
import artifactJson from "../../target/explorer_showcase-ExplorerShowcase.json" with { type: "json" };
import { logger } from "../../../../logger.js";

const CLASS_ID =
  "0x2629c93269b93787fa6ff60a7402b1714042d96c149774a16a21f06333e62af1";
const VERSION = 1;

const TARGET_URL = `https://api.testnet.aztecscan.xyz/v1/temporary-api-key/l2/contract-classes/${CLASS_ID}/versions/${VERSION}`;

export async function run() {
  logger.info(
    "===== REGISTER CONTRACT CLASS ARTIFACT (ExplorerShowcase) =====",
  );
  logger.info(`classId:  ${CLASS_ID}`);
  logger.info(`version:  ${VERSION}`);
  logger.info(`url:      ${TARGET_URL}`);

  const postData = JSON.stringify({ stringifiedArtifactJson: JSON.stringify(artifactJson) });
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
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
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

void run();
