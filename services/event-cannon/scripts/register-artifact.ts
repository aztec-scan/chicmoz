/* eslint-disable no-console */
import { generateVerifyArtifactPayload, generateVerifyArtifactUrl } from "@chicmoz-pkg/contract-verification";
import { NoirCompiledContract } from "@aztec/aztec.js";
import * as tokenContractArtifactJson from "@aztec/noir-contracts.js/artifacts/token_contract-Token" assert { type: "json" };
import http from "http";
import https from "https";

// TODO: currently this has only been used to register the token contract, but still comitting for reference

// Default API URL for the explorer
const EXPLORER_API_URL = "https://api.aztecscan.xyz/v1/temporary-api-key";

// Parse command line arguments
const args = process.argv.slice(2);
const contractClassId = args[0] || ""; // Default empty string
const version = parseInt(args[1] || "1", 10); // Default version 1

if (!contractClassId) {
  console.error("Error: Contract class ID is required");
  console.error("Usage: yarn run register-artifact <contractClassId> [version]");
  process.exit(1);
}

const contractLoggingName = "Token Contract";

const callExplorerApi = async ({
  urlStr,
  method,
  postData,
  loggingString,
}: {
  urlStr: string;
  method: string;
  postData: string;
  loggingString: string;
}) => {
  const url = new URL(urlStr);
  const request = url.protocol === "https:" ? https.request : http.request;

  const sizeInMB = Buffer.byteLength(postData) / 1000 ** 2;
  console.info(
    `📲📡 "${loggingString}" CALLING EXPLORER API (byte length: ${sizeInMB} MB)`
  );

  const res: {
    statusCode: number | undefined;
    statusMessage: string | undefined;
    data: string;
  } = await new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method,
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
      }
    );
    req.on("error", (error) => {
      console.error(`📲❌ "${loggingString}" REQUEST FAILED! rejecting...`);
      reject(error);
    });

    req.setTimeout(5000, () => {
      reject(new Error("Request timed out"));
    });

    req.write(postData);
    req.end();
  });
  
  if (res.statusCode === 200 || res.statusCode === 201) {
    console.info(
      `📲✅ "${loggingString}" SUCCESS! ${JSON.stringify({
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
      })}`
    );
  } else {
    console.error(
      `📲🚨 "${loggingString}" FAILED! ${JSON.stringify({
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        data: res.data,
      })}`
    );
  }
  return res;
};

type ArtifactObject = { default: NoirCompiledContract } | NoirCompiledContract;

const registerContractClassArtifact = async (
  contractLoggingName: string,
  artifactObj: ArtifactObject,
  contractClassId: string,
  version: number,
): Promise<void> => {
  const url = generateVerifyArtifactUrl(
    EXPLORER_API_URL,
    contractClassId,
    version,
  );
  const payload = generateVerifyArtifactPayload(artifactObj);
  console.log(`Generated URL: ${url}`);
  console.log(`Payload structure: ${JSON.stringify(Object.keys(payload))}`);
  
  const postData = JSON.stringify(payload);
  
  await callExplorerApi({
    loggingString: `📜 registerContractClassArtifact ${contractLoggingName}`,
    urlStr: url,
    postData,
    method: "POST",
  });
};

// Main function
void (async (): Promise<void> => {
  console.log(`Registering ${contractLoggingName} with class ID: ${contractClassId}, version: ${version}`);
  try {
    await registerContractClassArtifact(
      contractLoggingName,
      tokenContractArtifactJson as ArtifactObject,
      contractClassId,
      version,
    );
    console.log("Registration completed successfully!");
  } catch (error) {
    console.error("Error during registration:", error);
    process.exit(1);
  }
})();
