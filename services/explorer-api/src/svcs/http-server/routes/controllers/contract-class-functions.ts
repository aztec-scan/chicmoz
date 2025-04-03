import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import {
  getContractClassPrivateFunctionSchema,
  getContractClassPrivateFunctionsSchema,
  getContractClassUnconstrainedFunctionSchema,
  getContractClassUnconstrainedFunctionsSchema,
} from "../paths_and_validation.js";
import { dbWrapper } from "./utils/index.js";
import {
  contractClassPrivateFunctionResponse,
  contractClassPrivateFunctionResponseArray,
  contractClassUnconstrainedFunctionResponse,
  contractClassUnconstrainedFunctionResponseArray,
} from "./utils/open-api-responses.js";

export const openapi_GET_L2_CONTRACT_CLASS_PRIVATE_FUNCTIONS: OpenAPIObject["paths"] =
  {
    "/l2/contract-classes/{classId}/private-functions": {
      get: {
        tags: ["L2", "contract-classes"],
        summary:
          "Get broadcasted private functions of registered contract class",
        parameters: [
          {
            name: "classId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: contractClassPrivateFunctionResponseArray,
      },
    },
  };

export const GET_L2_CONTRACT_CLASS_PRIVATE_FUNCTIONS = asyncHandler(
  async (req, res) => {
    const { classId } =
      getContractClassPrivateFunctionsSchema.parse(req).params;
    const contractClasses = await dbWrapper.getLatest(
      ["l2", "contract-classes", classId, "private-functions"],
      () => db.l2Contract.getL2ContractClassPrivateFunctions(classId),
    );
    res.status(200).send(contractClasses);
  },
);

export const openapi_GET_L2_CONTRACT_CLASS_PRIVATE_FUNCTION: OpenAPIObject["paths"] =
  {
    "/l2/contract-classes/{classId}/private-functions/{functionSelector}": {
      get: {
        tags: ["L2", "contract-classes"],
        summary:
          "Get broadcasted private function of registered contract class",
        parameters: [
          {
            name: "classId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "functionSelector",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: contractClassPrivateFunctionResponse,
      },
    },
  };

export const GET_L2_CONTRACT_CLASS_PRIVATE_FUNCTION = asyncHandler(
  async (req, res) => {
    const { classId, functionSelector } =
      getContractClassPrivateFunctionSchema.parse(req).params;
    const contractClasses = await dbWrapper.getLatest(
      [
        "l2",
        "contract-classes",
        classId,
        "private-functions",
        functionSelector,
      ],
      () =>
        db.l2Contract.getL2ContractClassPrivateFunction(
          classId,
          functionSelector,
        ),
    );
    res.status(200).send(contractClasses);
  },
);

export const openapi_GET_L2_CONTRACT_CLASS_UNCONSTRAINED_FUNCTIONS: OpenAPIObject["paths"] =
  {
    "/l2/contract-classes/{classId}/unconstrained-functions": {
      get: {
        tags: ["L2", "contract-classes"],
        summary:
          "Get broadcasted unconstrained functions of registered contract class",
        parameters: [
          {
            name: "classId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: contractClassUnconstrainedFunctionResponseArray,
      },
    },
  };

export const GET_L2_CONTRACT_CLASS_UNCONSTRAINED_FUNCTIONS = asyncHandler(
  async (req, res) => {
    const { classId } =
      getContractClassUnconstrainedFunctionsSchema.parse(req).params;
    const contractClasses = await dbWrapper.getLatest(
      ["l2", "contract-classes", classId, "unconstrained-functions"],
      () => db.l2Contract.getL2ContractClassUnconstrainedFunctions(classId),
    );
    res.status(200).send(contractClasses);
  },
);

export const openapi_GET_L2_CONTRACT_CLASS_UNCONSTRAINED_FUNCTION: OpenAPIObject["paths"] =
  {
    "/l2/contract-classes/{classId}/unconstrained-functions/{functionSelector}":
      {
        get: {
          tags: ["L2", "contract-classes"],
          summary:
            "Get broadcasted unconstrained function of registered contract class",
          parameters: [
            {
              name: "classId",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
            },
            {
              name: "functionSelector",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
            },
          ],
          responses: contractClassUnconstrainedFunctionResponse,
        },
      },
  };

export const GET_L2_CONTRACT_CLASS_UNCONSTRAINED_FUNCTION = asyncHandler(
  async (req, res) => {
    const { classId, functionSelector } =
      getContractClassUnconstrainedFunctionSchema.parse(req).params;
    const contractClasses = await dbWrapper.getLatest(
      [
        "l2",
        "contract-classes",
        classId,
        "unconstrained-functions",
        functionSelector,
      ],
      () =>
        db.l2Contract.getL2ContractClassUnconstrainedFunction(
          classId,
          functionSelector,
        ),
    );
    res.status(200).send(contractClasses);
  },
);
