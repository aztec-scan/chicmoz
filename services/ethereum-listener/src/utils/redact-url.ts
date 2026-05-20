export const redactUrlForLogs = (value: string | undefined): string => {
  if (!value) {
    return "not configured";
  }

  return "configured (redacted)";
};
