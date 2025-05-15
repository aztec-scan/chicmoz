import { uiTxEffectTableSchema, type UiBlockTable } from "@chicmoz-pkg/types";
import { blockSchema } from "~/components/blocks/blocks-schema";

export const mapLatestBlocks = (latestBlocks?: UiBlockTable[]) => {
  if (!latestBlocks) {
    return undefined;
  }
  //This is here to parse Bigint to Number
  return latestBlocks.map((block) => {
    return uiTxEffectTableSchema.parse(block);
  });
};
