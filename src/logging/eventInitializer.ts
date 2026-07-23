import { Client } from "discord.js";
import logger from "./logger";
import { setupMessageEvents } from "../events/messageEvents";
import { setupLoggingEvents } from "./loggingEvents";
import { setupWelcomeEvents } from "./welcomeEvents";

export async function initializeEventHandlers(client: Client): Promise<void> {
  try {
    await setupLoggingEvents(client);
    await setupWelcomeEvents(client);
    await setupMessageEvents(client);
    logger.info("✅ All event handlers initialized");
  } catch (error) {
    logger.error("Failed to initialize event handlers", { error });
    throw error;
  }
}
