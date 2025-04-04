import { type SimplifiedViewOfFunc } from "./artifact-parser";

export const getDataFromMap = (data: SimplifiedViewOfFunc) => {
  const result: Record<string, Record<string, string>> = {};
  for (const [key, value] of data) {
    result[key] = {};
    for (const [k, v] of value) {
      result[key][k] = v;
    }
  }
  return result;
};
