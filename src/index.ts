import dotenv from "dotenv";
import logger from "./logging/logger";
import config from "./config/config";
import { bot } from "./events/botEvents";
import { expressServer } from "./server/expressServer";

dotenv.config();

async function main(): Promise<void> {
  try {
    logger.info("🚀 SpunkyAI Bot Starting...");
    logger.info(`Environment: ${config.server.nodeEnv}`);
    logger.info(`AI Provider: ${config.ai.provider}`);

    // Start Express server
    expressServer.start();

    // Start Discord bot
    await bot.start();

    logger.info("✅ All systems operational");
  } catch (error) {
    logger.error("Fatal error during startup", { error });
    process.exit(1);
  }
}

main();