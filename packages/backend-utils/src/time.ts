export const parseTimeStamp = (timestamp: number) => {
  return Math.abs(timestamp).toString().length <= 10 ? timestamp * 1000: timestamp
}
