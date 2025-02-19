import { NODE_ENV, NodeEnv } from "@chicmoz-pkg/types";
import http from "http";
import https from "https";
import { logger } from "../../../logger.js";

const SLEEP_TIME = NODE_ENV === NodeEnv.PROD ? 10000 : 5000;

export const callExplorerApi = async ({
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
  logger.info(
    `📲📡 CALLING EXPLORER API: "${loggingString}" but first sleeping for ${
      SLEEP_TIME / 1000
    } seconds... (byte length: ${sizeInMB} MB)`
  );

  await new Promise((resolve) => setTimeout(resolve, SLEEP_TIME));
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
      logger.error(`📲❌ REQUEST FAILED! "${loggingString}" rejecting...`);
      reject(error);
    });

    req.setTimeout(5000, () => {
      reject(new Error("Request timed out"));
    });

    req.write(postData);
    req.end();
  });
  if (res.statusCode === 200 || res.statusCode === 201) {
    logger.info(
      `📲✅ SUCCESS! "${loggingString}" ${JSON.stringify({
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
      })}`
    );
  } else {
    logger.error(
      `📲🚨 FAILED! "${loggingString}" ${JSON.stringify({
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        data: res.data,
      })}`
    );
  }
  return res;
};
//export const registerContractClassArtifact = async (
//  contractLoggingName: string,
//  artifactObj: { default: NoirCompiledContract } | NoirCompiledContract,
//  contractClassId: string,
//  version: number,
//  skipSleep = false
//) => {
//  if (NODE_ENV === NodeEnv.PROD) {
//    logger.info(`Sleeping for 10 seconds before registering contract class`);
//    await new Promise((resolve) => setTimeout(resolve, 10000));
//  }
//  const url = new URL(
//    generateVerifyArtifactUrl(EXPLORER_API_URL, contractClassId, version)
//  );
//  const postData = JSON.stringify(generateVerifyArtifactPayload(artifactObj));
//
//  const sizeInMB = Buffer.byteLength(postData) / 1000 ** 2;
//  if (sizeInMB > 10) {
//    logger.warn(
//      `🚨📜 ${contractLoggingName} Artifact is too large to register in explorer-api: ${url.href} (byte length: ${sizeInMB} MB)`
//    );
//    return;
//  }
//  logger.info(
//    `📜 ${contractLoggingName} Trying to register artifact in explorer-api: ${url.href} (byte length: ${sizeInMB} MB)`
//  );
//  if (!skipSleep) await new Promise((resolve) => setTimeout(resolve, 1000));
//
//  const request = url.protocol === "https:" ? https.request : http.request;
//
//  const res: {
//    statusCode: number | undefined;
//    statusMessage: string | undefined;
//    data: string;
//  } = await new Promise((resolve, reject) => {
//    const req = request(
//      url,
//      {
//        method: "POST",
//        headers: {
//          "Content-Type": "application/json",
//          "Content-Length": Buffer.byteLength(postData),
//        },
//      },
//      (res) => {
//        let data = "";
//        res.on("data", (chunk) => {
//          data += chunk;
//        });
//        res.on("end", () => {
//          resolve({
//            statusCode: res.statusCode,
//            statusMessage: res.statusMessage,
//            data,
//          });
//        });
//        // get the status code
//      }
//    );
//    req.on("error", (error) => {
//      logger.error(`🚨📜 ${contractLoggingName} Artifact registration failed.`);
//      reject(error);
//    });
//
//    // Set a timeout (e.g., 5 seconds)
//    req.setTimeout(5000, () => {
//      reject(new Error("Request timed out"));
//    });
//
//    req.write(postData);
//    req.end(); // This actually sends the request
//  });
//  if (res.statusCode === 200 || res.statusCode === 201) {
//    logger.info(
//      `📜✅ ${contractLoggingName} Artifact registered in explorer-api. ${JSON.stringify(
//        {
//          statusCode: res.statusCode,
//          statusMessage: res.statusMessage,
//        }
//      )}`
//    );
//  } else {
//    logger.error(
//      `📜🚨 ${contractLoggingName} Artifact registration failed. ${JSON.stringify(
//        {
//          statusCode: res.statusCode,
//          statusMessage: res.statusMessage,
//          data: res.data,
//        }
//      )}`
//    );
//  }
//};
//
//export const verifyContractInstanceDeployment = async (
//  contractLoggingName: string,
//  artifactObj: { default: NoirCompiledContract } | NoirCompiledContract,
//  contractInstanceAddress: string,
//  publicKeysString: string,
//  deployer: string,
//  salt: string,
//  args: string[],
//  skipSleep = false
//) => {
//  const url = new URL(
//    generateVerifyInstanceUrl(EXPLORER_API_URL, contractInstanceAddress)
//  );
//
//  const postData = JSON.stringify(
//    generateVerifyInstancePayload({
//      publicKeysString,
//      deployer,
//      salt,
//      constructorArgs: args,
//      artifactObj,
//    })
//  );
//  // TODO: unified explorer-calls
//  const sizeInMB = Buffer.byteLength(postData) / 1000 ** 2;
//  if (sizeInMB > 10) {
//    logger.warn(
//      `🚨📜 ${contractLoggingName} Artifact is too large to VERIFY in explorer-api: ${url.href} (byte length: ${sizeInMB} MB)`
//    );
//    return;
//  }
//  logger.info(
//    `📜 ${contractLoggingName} Trying to VERIFY artifact in explorer-api: ${url.href} (byte length: ${sizeInMB} MB)`
//  );
//  if (!skipSleep) await new Promise((resolve) => setTimeout(resolve, 10000));
//
//  const request = url.protocol === "https:" ? https.request : http.request;
//
//  const res: {
//    statusCode: number | undefined;
//    statusMessage: string | undefined;
//    data: string;
//  } = await new Promise((resolve, reject) => {
//    const req = request(
//      url,
//      {
//        method: "POST",
//        headers: {
//          "Content-Type": "application/json",
//          "Content-Length": Buffer.byteLength(postData),
//        },
//      },
//      (res) => {
//        let data = "";
//        res.on("data", (chunk) => {
//          data += chunk;
//        });
//        res.on("end", () => {
//          resolve({
//            statusCode: res.statusCode,
//            statusMessage: res.statusMessage,
//            data,
//          });
//        });
//        // get the status code
//      }
//    );
//    req.on("error", (error) => {
//      logger.error(`🚨📜 ${contractLoggingName} Artifact VERIFICATION failed.`);
//      reject(error);
//    });
//
//    // Set a timeout (e.g., 5 seconds)
//    req.setTimeout(5000, () => {
//      reject(new Error("Request timed out"));
//    });
//
//    req.write(postData);
//    req.end(); // This actually sends the request
//  });
//  if (res.statusCode === 200 || res.statusCode === 201) {
//    logger.info(
//      `📜✅ ${contractLoggingName} Artifact VERIFIED in explorer-api. ${JSON.stringify(
//        {
//          statusCode: res.statusCode,
//          statusMessage: res.statusMessage,
//        }
//      )}`
//    );
//  } else {
//    logger.error(
//      `📜🚨 ${contractLoggingName} Artifact VERIFICATION failed. ${JSON.stringify(
//        {
//          statusCode: res.statusCode,
//          statusMessage: res.statusMessage,
//          data: res.data,
//        }
//      )}`
//    );
//  }
//};
//
//export const verifyContractInstanceDeployment = async (
//  contractLoggingName: string,
//  artifactObj: { default: NoirCompiledContract } | NoirCompiledContract,
//  contractInstanceAddress: string,
//  publicKeysString: string,
//  deployer: string,
//  salt: string,
//  args: string[],
//  skipSleep = false
//) => {
//  const url = new URL(
//    generateVerifyInstanceUrl(EXPLORER_API_URL, contractInstanceAddress)
//  );
//
//  const postData = JSON.stringify(
//    generateVerifyInstancePayload({
//      publicKeysString,
//      deployer,
//      salt,
//      constructorArgs: args,
//      artifactObj,
//    })
//  );
//  // TODO: unified explorer-calls
//  const sizeInMB = Buffer.byteLength(postData) / 1000 ** 2;
//  if (sizeInMB > 10) {
//    logger.warn(
//      `🚨📜 ${contractLoggingName} Artifact is too large to VERIFY in explorer-api: ${url.href} (byte length: ${sizeInMB} MB)`
//    );
//    return;
//  }
//  logger.info(
//    `📜 ${contractLoggingName} Trying to VERIFY artifact in explorer-api: ${url.href} (byte length: ${sizeInMB} MB)`
//  );
//  if (!skipSleep) await new Promise((resolve) => setTimeout(resolve, 10000));
//
//  const request = url.protocol === "https:" ? https.request : http.request;
//
//  const res: {
//    statusCode: number | undefined;
//    statusMessage: string | undefined;
//    data: string;
//  } = await new Promise((resolve, reject) => {
//    const req = request(
//      url,
//      {
//        method: "POST",
//        headers: {
//          "Content-Type": "application/json",
//          "Content-Length": Buffer.byteLength(postData),
//        },
//      },
//      (res) => {
//        let data = "";
//        res.on("data", (chunk) => {
//          data += chunk;
//        });
//        res.on("end", () => {
//          resolve({
//            statusCode: res.statusCode,
//            statusMessage: res.statusMessage,
//            data,
//          });
//        });
//        // get the status code
//      }
//    );
//    req.on("error", (error) => {
//      logger.error(`🚨📜 ${contractLoggingName} Artifact VERIFICATION failed.`);
//      reject(error);
//    });
//
//    // Set a timeout (e.g., 5 seconds)
//    req.setTimeout(5000, () => {
//      reject(new Error("Request timed out"));
//    });
//
//    req.write(postData);
//    req.end(); // This actually sends the request
//  });
//  if (res.statusCode === 200 || res.statusCode === 201) {
//    logger.info(
//      `📜✅ ${contractLoggingName} Artifact VERIFIED in explorer-api. ${JSON.stringify(
//        {
//          statusCode: res.statusCode,
//          statusMessage: res.statusMessage,
//        }
//      )}`
//    );
//  } else {
//    logger.error(
//      `📜🚨 ${contractLoggingName} Artifact VERIFICATION failed. ${JSON.stringify(
//        {
//          statusCode: res.statusCode,
//          statusMessage: res.statusMessage,
//          data: res.data,
//        }
//      )}`
//    );
//  }
//};
