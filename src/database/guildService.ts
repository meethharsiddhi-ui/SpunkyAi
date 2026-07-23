import prisma from "./prisma";
import { Guild } from "discord.js";
import logger from "../logging/logger";

export class GuildService {
  static async getOrCreateGuild(guild: Guild) {
    try {
      const existing = await prisma.guild.findUnique({
        where: { id: guild.id },
      });

      if (existing) return existing;

      return await prisma.guild.create({
        data: {
          id: guild.id,
          name: guild.name,
          prefix: "?",
        },
      });
    } catch (error) {
      logger.error("Failed to get or create guild", { error, guildId: guild.id });
      throw error;
    }
  }

  static async updateGuild(
    guildId: string,
    data: {
      prefix?: string;
      aiEnabled?: boolean;
      loggingEnabled?: boolean;
      logChannelId?: string;
      modLogChannelId?: string;
      joinLogChannelId?: string;
      leaveLogChannelId?: string;
    }
  ) {
    try {
      return await prisma.guild.update({
        where: { id: guildId },
        data,
      });
    } catch (error) {
      logger.error("Failed to update guild", { error, guildId });
      throw error;
    }
  }

  static async getGuild(guildId: string) {
    try {
      return await prisma.guild.findUnique({
        where: { id: guildId },
      });
    } catch (error) {
      logger.error("Failed to get guild", { error, guildId });
      throw error;
    }
  }
}
