import { getEntry, setEntry } from "@chicmoz-pkg/redis-helper";
import { NODE_ENV, NodeEnv } from "@chicmoz-pkg/types";
import asyncHandler from "express-async-handler";
import { PUBLIC_API_KEY } from "../../../../environment.js";
import { controllers as db } from "../../../database/index.js";
import {
  address,
  blockHash,
  blockHeight,
  currentContractClassId,
  functionSelector,
  heightOrHash,
  paths,
  txEffectHash,
  txEffectIndex,
  version,
} from "../paths_and_validation.js";

const SUB_PATH = `/v1/${PUBLIC_API_KEY}`;

export const GET_ROUTES = asyncHandler(async (_req, res) => {
  const cacheRes = await getEntry(["GET_ROUTES"]);
  const cachedHtml = cacheRes.value;
  if (cachedHtml) {
    res.send(cachedHtml);
    return;
  }
  const block = await db.signOfLife.getABlock();
  const blockAndTxEffect = await db.signOfLife.getABlockWithTxEffects();
  const blockAndAContractInstance =
    await db.signOfLife.getABlockWithContractInstances();
  const contractClassesWithArtifactJson =
    await db.signOfLife.getContractClassesWithArtifactJson();
  const { privateFunction, unconstrainedFunction } =
    await db.signOfLife.getL2ContractFunctions();
  const somePrivateLogsTxEffects =
    await db.signOfLife.getSomeTxEffectWithPrivateLogs();
  const somePublicLogsTxEffects =
    await db.signOfLife.getSomeTxEffectWithPublicLogs();
  const r = [paths.latestHeight, paths.latestBlock, `${paths.blocks}?from=0`];
  const searchRoutes = [];

  if (block) {
    r.push(paths.block.replace(`:${heightOrHash}`, block.height.toString()));
    r.push(paths.block.replace(`:${heightOrHash}`, block.hash));
    searchRoutes.push(
      `${paths.search}?q=${block.height.toString()}`,
      `${paths.search}?q=${block.hash}`
    );
  } else {
    r.push(paths.block + "NOT FOUND");
  }

  if (blockAndTxEffect) {
    r.push(
      paths.txEffectsByBlockHeight.replace(
        `:${blockHeight}`,
        blockAndTxEffect.block.height.toString()
      )
    );
    r.push(
      paths.txEffectByBlockHeightAndIndex
        .replace(`:${blockHeight}`, blockAndTxEffect.block.height.toString())
        .replace(
          `:${txEffectIndex}`,
          blockAndTxEffect.txEffects[0].index.toString()
        )
    );
    r.push(
      paths.txEffectsByTxEffectHash.replace(
        `:${txEffectHash}`,
        blockAndTxEffect.txEffects[0].hash
      )
    );
    searchRoutes.push(
      `${paths.search}?q=${blockAndTxEffect.txEffects[0].hash}`
    );
  } else {
    r.push(paths.txEffectsByBlockHeight + "NOT FOUND");
    r.push(paths.txEffectByBlockHeightAndIndex + "NOT FOUND");
    r.push(paths.txEffectsByTxEffectHash + "NOT FOUND");
  }

  if (blockAndAContractInstance) {
    r.push(
      paths.contractClass
        .replace(
          `:${currentContractClassId}`,
          blockAndAContractInstance.contractInstance.classId
        )
        .replace(
          `:${version}`,
          blockAndAContractInstance.contractInstance.version.toString()
        )
    );
    r.push(
      paths.contractClassesByClassId.replace(
        `:${currentContractClassId}`,
        blockAndAContractInstance.contractInstance.classId
      )
    );
    r.push(paths.contractClasses);
    r.push(
      paths.contractInstancesByBlockHash.replace(
        `:${blockHash}`,
        blockAndAContractInstance.block.hash
      )
    );
    r.push(
      paths.contractInstancesByContractClassId.replace(
        `:${currentContractClassId}`,
        blockAndAContractInstance.contractInstance.classId
      )
    );
    r.push(
      paths.contractInstance.replace(
        `:${address}`,
        blockAndAContractInstance.contractInstance.address
      )
    );
    r.push(paths.contractInstances);
    searchRoutes.push(
      `${paths.search}?q=${blockAndAContractInstance.contractInstance.address}`,
      `${paths.search}?q=${blockAndAContractInstance.contractInstance.classId}`
    );
  } else {
    r.push(paths.contractInstancesByBlockHash + "NOT FOUND");
    r.push(paths.contractInstance + "NOT FOUND");
  }
  if (privateFunction) {
    r.push(
      paths.contractClassPrivateFunctions.replace(
        `:${currentContractClassId}`,
        privateFunction.currentContractClassId
      )
    );
    r.push(
      paths.contractClassPrivateFunction
        .replace(`:${currentContractClassId}`, privateFunction.currentContractClassId)
        .replace(
          `:${functionSelector}`,
          privateFunction.functionSelector.toString()
        )
    );
  }
  if (unconstrainedFunction) {
    r.push(
      paths.contractClassUnconstrainedFunctions.replace(
        `:${currentContractClassId}`,
        unconstrainedFunction.currentContractClassId
      )
    );
    r.push(
      paths.contractClassUnconstrainedFunction
        .replace(`:${currentContractClassId}`, unconstrainedFunction.currentContractClassId)
        .replace(
          `:${functionSelector}`,
          unconstrainedFunction.functionSelector.toString()
        )
    );
  } else {
    r.push(paths.contractClassPrivateFunctions + "NOT FOUND");
    r.push(paths.contractClassUnconstrainedFunctions + "NOT FOUND");
  }

  r.push(paths.chainInfo);
  r.push(paths.chainErrors);

  const statsRoutes = [
    paths.statsTotalTxEffects,
    paths.statsTotalTxEffectsLast24h,
    paths.statsTotalContracts,
    paths.statsTotalContractsLast24h,
    paths.statsAverageFees,
    paths.statsAverageBlockTime,
  ];

  const html = `
  <html>
    <head>
      <title>CHICMOZ API ROUTES</title>
    </head>
    <body>
      <h2>General routes</h2>
      <ul>
        ${r
      .map((route) => `<li><a href=${SUB_PATH + route}>${route}</a></li>`)
      .join("")}
      </ul>
      <br>
      <h2>Some tx effects with logs</h2>
      <h3>Private logs</h3>
      <ul>
        ${somePrivateLogsTxEffects
      ?.map(
        (hash) =>
          `<li><a href=localhost:5173/tx-effects/${hash}>${hash}</a></li>`
      )
      .join("")}
      </ul>
      <h3>Public logs</h3>
      <ul>
        ${somePublicLogsTxEffects
      ?.map(
        (hash) =>
          `<li><a href=localhost:5173/tx-effects/${hash}>${hash}</a></li>`
      )
      .join("")}
      </ul>
      <br>
      <h2>Contract classes with artifact json</h2>
      <ul>
        ${contractClassesWithArtifactJson
      .map(
        (contractClass) =>
          `<li><a href=${SUB_PATH}/contract-classes/${contractClass.classId}/versions/${contractClass.version}>${contractClass.classId} - ${contractClass.version}</a></li>`
      )
      .join("")}
      </ul>
      <h2>Search routes</h2>
      <ul>
        ${searchRoutes
      .map((route) => `<li><a href=${SUB_PATH + route}>${route}</a></li>`)
      .join("")}
      </ul>
      <br>
      <h2>Stats routes</h2>
      <ul>
        ${statsRoutes
      .map((route) => `<li><a href=${SUB_PATH + route}>${route}</a></li>`)
      .join("")}
      </ul>
    </body>
  </html>
  `;
  await setEntry(["GET_ROUTES"], html, NODE_ENV === NodeEnv.PROD ? 60 : 2);
  res.send(html);
});
