import axios, { type AxiosError } from "axios";
import { ZodError, type z } from "zod";
import { API_BASE_URL } from "./config.js";

// TODO: evaluate if client instead should be a hook?
const client = axios.create({
  baseURL: API_BASE_URL,
});

client.defaults.headers.get["Content-Type"] = "application/json";
client.defaults.headers.get["Access-Control-Allow-Credentials"] = "true";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public type: "API" | "Schema" = "API"
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let lastSuccessfulRequest: { date: Date; path: string } | null = null;
let lastError: { date: Date; error: ApiError } | null = null;

client.interceptors.response.use(
  (response) => {
    lastSuccessfulRequest = {
      date: new Date(),
      path: response.config.url ?? "Unknown",
    };
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      let errorString = error.response.statusText;
      try {
        errorString =
          typeof error.response.data === "string"
            ? error.response.data
            : JSON.stringify(error.response.data);
      } catch {
        // ignore
      }
      lastError = {
        date: new Date(),
        error: new ApiError(error.response.status, errorString, "API"),
      };
    } else if (error.request) {
      lastError = {
        date: new Date(),
        error: new ApiError(0, "No response received from server", "API"),
      };
    } else {
      lastError = {
        date: new Date(),
        error: new ApiError(
          0,
          error.message || "An unexpected error occurred",
          "API"
        ),
      };
    }
    throw lastError.error;
  }
);

export const validateResponse = <T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      lastError = {
        date: new Date(),
        // TODO: add request-path to error
        error: new ApiError(400, error.errors[0].message, "Schema"),
      };
    } else {
      lastError = {
        date: new Date(),
        error: new ApiError(
          400,
          `Failed to validate response: ${(error as Error).message}`,
          "Schema"
        ),
      };
    }
    throw lastError.error;
  }
};

export const getLastSuccessfulRequest = () => lastSuccessfulRequest;
export const getLastError = () => lastError;

export default client;
