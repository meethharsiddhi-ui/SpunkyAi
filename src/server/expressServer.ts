import express, { Express, Request, Response } from "express";
import logger from "../logging/logger";
import config from "../config/config";

export class ExpressServer {
  private app: Express;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    this.app.get("/", (req: Request, res: Response) => {
      res.json({
        status: "online",
        name: "SpunkyAI Discord Bot",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      });
    });

    this.app.get("/health", (req: Request, res: Response) => {
      res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    });

    this.app.get("/status", (req: Request, res: Response) => {
      res.json({
        status: "running",
        environment: config.server.nodeEnv,
        port: this.port,
      });
    });

    // 404
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: "Not Found" });
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`Express server running on port ${this.port}`);
    });
  }
}

export const expressServer = new ExpressServer(config.server.port);