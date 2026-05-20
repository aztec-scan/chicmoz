export const redactUrlForLogs = (value: string | undefined): string => {
  if (!value) {
    return "not configured";
  }

  try {
    const url = new URL(value);
    const port = url.port ? `:${url.port}` : "";
    return `configured: ${url.protocol}//${url.hostname}${port}`;
  } catch {
    return "configured (unparseable)";
  }
};
