import logger from "../logging/logger";
import prisma from "../database/prisma";
import { v4 as uuidv4 } from "uuid";

export class WelcomeService {
  async setupWelcome(
    guildId: string,
    channelId: string,
    message: string,
    autoRoleId?: string
  ): Promise<boolean> {
    try {
      const existing = await prisma.welcomeConfig.findUnique({
        where: { guildId },
      });

      if (existing) {
        await prisma.welcomeConfig.update({
          where: { guildId },
          data: {
            enabled: true,
            channelId,
            message,
            autoRoleId,
          },
        });
      } else {
        await prisma.welcomeConfig.create({
          data: {
            id: uuidv4(),
            guildId,
            enabled: true,
            channelId,
            message,
            autoRoleId,
          },
        });
      }

      logger.info(`Welcome system setup for guild: ${guildId}`);
      return true;
    } catch (error) {
      logger.error("Failed to setup welcome", { error, guildId });
      return false;
    }
  }

  async setupGoodbye(
    guildId: string,
    channelId: string,
    message: string
  ): Promise<boolean> {
    try {
      const existing = await prisma.welcomeConfig.findUnique({
        where: { guildId },
      });

      if (existing) {
        await prisma.welcomeConfig.update({
          where: { guildId },
          data: {
            goodbyeChannelId: channelId,
            goodbyeMessage: message,
          },
        });
      } else {
        await prisma.welcomeConfig.create({
          data: {
            id: uuidv4(),
            guildId,
            goodbyeChannelId: channelId,
            goodbyeMessage: message,
          },
        });
      }

      return true;
    } catch (error) {
      logger.error("Failed to setup goodbye", { error, guildId });
      return false;
    }
  }

  async disableWelcome(guildId: string): Promise<boolean> {
    try {
      await prisma.welcomeConfig.update({
        where: { guildId },
        data: { enabled: false },
      });
      return true;
    } catch (error) {
      logger.error("Failed to disable welcome", { error, guildId });
      return false;
    }
  }
}

export const welcomeService = new WelcomeService();