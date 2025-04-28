import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import {
  getContractClassPrivateFunctionSchema,
  getContractClassPrivateFunctionsSchema,
  getContractClassUtilityFunctionSchema,
  getContractClassUtilityFunctionsSchema,
} from "../paths_and_validation.js";
import { dbWrapper } from "./utils/index.js";
import {
  contractClassPrivateFunctionResponse,
  contractClassPrivateFunctionResponseArray,
  contractClassUtilityFunctionResponse,
  contractClassUtilityFunctionResponseArray,
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
    const { contractClassId } =
      getContractClassPrivateFunctionsSchema.parse(req).params;
    const contractClasses = await dbWrapper.getLatest(
      ["l2", "contract-classes", contractClassId, "private-functions"],
      () => db.l2Contract.getL2ContractClassPrivateFunctions(contractClassId),
    );
    res.status(200).json(JSON.parse(contractClasses));
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
    const { contractClassId, functionSelector } =
      getContractClassPrivateFunctionSchema.parse(req).params;
    const contractClasses = await dbWrapper.getLatest(
      [
        "l2",
        "contract-classes",
        contractClassId,
        "private-functions",
        functionSelector,
      ],
      () =>
        db.l2Contract.getL2ContractClassPrivateFunction(
          contractClassId,
          functionSelector,
        ),
    );
    res.status(200).json(JSON.parse(contractClasses));
  },
);

export const openapi_GET_L2_CONTRACT_CLASS_UTILITY_FUNCTIONS: OpenAPIObject["paths"] =
  {
    "/l2/contract-classes/{classId}/utility-functions": {
      get: {
        tags: ["L2", "contract-classes"],
        summary:
          "Get broadcasted utility functions of registered contract class",
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
        responses: contractClassUtilityFunctionResponseArray,
      },
    },
  };

export const GET_L2_CONTRACT_CLASS_UTILITY_FUNCTIONS = asyncHandler(
  async (req, res) => {
    const { contractClassId } =
      getContractClassUtilityFunctionsSchema.parse(req).params;
    const contractClasses = await dbWrapper.getLatest(
      ["l2", "contract-classes", contractClassId, "utility-functions"],
      () => db.l2Contract.getL2ContractClassUtilityFunctions(contractClassId),
    );
    res.status(200).json(JSON.parse(contractClasses));
  },
);

export const openapi_GET_L2_CONTRACT_CLASS_UTILITY_FUNCTION: OpenAPIObject["paths"] =
  {
    "/l2/contract-classes/{classId}/utility-functions/{functionSelector}": {
      get: {
        tags: ["L2", "contract-classes"],
        summary:
          "Get broadcasted utility function of registered contract class",
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
        responses: contractClassUtilityFunctionResponse,
      },
    },
  };

export const GET_L2_CONTRACT_CLASS_UTILITY_FUNCTION = asyncHandler(
  async (req, res) => {
    const { contractClassId, functionSelector } =
      getContractClassUtilityFunctionSchema.parse(req).params;
    const contractClasses = await dbWrapper.getLatest(
      [
        "l2",
        "contract-classes",
        contractClassId,
        "utility-functions",
        functionSelector,
      ],
      () =>
        db.l2Contract.getL2ContractClassUtilityFunction(
          contractClassId,
          functionSelector,
        ),
    );
    res.status(200).json(JSON.parse(contractClasses));
  },
);
