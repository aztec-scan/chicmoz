import { type UiBlockTable } from "@chicmoz-pkg/types";
import { blockSchema } from "~/components/blocks/blocks-schema";

export const mapLatestBlocks = (latestBlocks?: UiBlockTable[]) => {
  if (!latestBlocks) {
    return undefined;
  }
  //This is her to parse Bigint to Number
  return latestBlocks.map((block) => {
    return blockSchema.parse(block);
  });
};
