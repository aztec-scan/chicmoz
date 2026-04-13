import { Server as HttpServer, IncomingMessage, ServerResponse } from "http";
import { logger } from "../logger.js";

let httpServer: HttpServer | null = null;

export const createHealthCheckServer = (wssPort: number): HttpServer => {
  const healthPort = wssPort + 1; // Use port 3001 for health checks

  httpServer = new HttpServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url === "/health" || req.url === "/healthz") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
      );
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });

  httpServer.listen(healthPort, () => {
    logger.info(`Health check endpoint listening on port ${healthPort}`);
  });

  return httpServer;
};

export const closeHealthCheckServer = async (): Promise<void> => {
  if (!httpServer) {
    return;
  }

  return new Promise<void>((resolve) => {
    httpServer?.close(() => {
      logger.info("Health check server closed");
      resolve();
    });
  });
};
