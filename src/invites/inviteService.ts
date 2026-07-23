import logger from "../logging/logger";
import prisma from "../database/prisma";
import { v4 as uuidv4 } from "uuid";

export class InviteService {
  async trackInvite(guildId: string, code: string, creatorId: string): Promise<any> {
    try {
      const existing = await prisma.invite.findUnique({
        where: { code },
      });

      if (existing) return existing;

      return await prisma.invite.create({
        data: {
          id: uuidv4(),
          guildId,
          code,
          creatorId,
        },
      });
    } catch (error) {
      logger.error("Failed to track invite", { error, guildId });
      return null;
    }
  }

  async recordInviteUse(code: string): Promise<boolean> {
    try {
      const invite = await prisma.invite.findUnique({
        where: { code },
      });

      if (!invite) return false;

      await prisma.invite.update({
        where: { code },
        data: { uses: invite.uses + 1 },
      });

      return true;
    } catch (error) {
      logger.error("Failed to record invite use", { error, code });
      return false;
    }
  }

  async getInviteLeaderboard(guildId: string, limit: number = 10): Promise<any[]> {
    try {
      return await prisma.invite.findMany({
        where: { guildId },
        orderBy: { uses: "desc" },
        take: limit,
      });
    } catch (error) {
      logger.error("Failed to get invite leaderboard", { error, guildId });
      return [];
    }
  }

  async getInvites(guildId: string): Promise<any[]> {
    try {
      return await prisma.invite.findMany({
        where: { guildId },
      });
    } catch (error) {
      logger.error("Failed to get invites", { error, guildId });
      return [];
    }
  }
}

export const inviteService = new InviteService();