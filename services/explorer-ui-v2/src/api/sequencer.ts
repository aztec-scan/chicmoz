import {
  type ChicmozL2Sequencer,
  chicmozL2SequencerSchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const SequencerAPI = {
  getAllSequencers: async (): Promise<ChicmozL2Sequencer[]> => {
    const response = await client.get(aztecExplorer.getL2Sequencers);
    return validateResponse(z.array(chicmozL2SequencerSchema), response.data);
  },
};
