// Add this function to the existing api-client.ts file
export const queryGetBlocksByStatus = async (): Promise<ChicmozL2BlockLight[]> => {
  const response = await fetch(`${API_URL}/l2/blocks/by-status`);
  const data = await response.json();
  return data;
};
