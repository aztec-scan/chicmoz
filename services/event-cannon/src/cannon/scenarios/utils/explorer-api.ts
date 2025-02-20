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
