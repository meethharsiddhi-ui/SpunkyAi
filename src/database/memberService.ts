import prisma from "./prisma";
import logger from "../logging/logger";
import { v4 as uuidv4 } from "uuid";

export class MemberService {
  static async getOrCreateMember(guildId: string, userId: string, isBot: boolean = false) {
    try {
      const existing = await prisma.guildMember.findUnique({
        where: {
          guildId_userId: { guildId, userId },
        },
      });

      if (existing) return existing;

      return await prisma.guildMember.create({
        data: {
          id: uuidv4(),
          guildId,
          userId,
          isBot,
        },
      });
    } catch (error) {
      logger.error("Failed to get or create member", { error, guildId, userId });
      throw error;
    }
  }

  static async getMember(guildId: string, userId: string) {
    try {
      return await prisma.guildMember.findUnique({
        where: {
          guildId_userId: { guildId, userId },
        },
      });
    } catch (error) {
      logger.error("Failed to get member", { error, guildId, userId });
      throw error;
    }
  }

  static async getOrCreateWarning(
    guildId: string,
    userId: string,
    reason: string,
    moderatorId?: string
  ) {
    try {
      // First ensure member exists
      await this.getOrCreateMember(guildId, userId);

      const warning = await prisma.warning.create({
        data: {
          id: uuidv4(),
          guildId,
          userId,
          reason,
          moderatorId,
          severity: 1,
        },
      });

      // Update warn count
      const warnCount = await prisma.warning.count({
        where: { guildId, userId },
      });

      await prisma.guildMember.update({
        where: {
          guildId_userId: { guildId, userId },
        },
        data: {
          warnCount,
        },
      });

      return warning;
    } catch (error) {
      logger.error("Failed to create warning", { error, guildId, userId });
      throw error;
    }
  }

  static async getWarnings(guildId: string, userId: string) {
    try {
      return await prisma.warning.findMany({
        where: { guildId, userId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error("Failed to get warnings", { error, guildId, userId });
      throw error;
    }
  }
}
