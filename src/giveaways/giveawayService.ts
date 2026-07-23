import { Guild } from "discord.js";
import logger from "../logging/logger";
import prisma from "../database/prisma";
import { v4 as uuidv4 } from "uuid";

export class GiveawayService {
  async createGiveaway(
    guildId: string,
    channelId: string,
    prize: string,
    duration: number,
    winnerCount: number
  ): Promise<any> {
    try {
      const endsAt = new Date(Date.now() + duration);

      const giveaway = await prisma.giveaway.create({
        data: {
          id: uuidv4(),
          guildId,
          messageId: uuidv4(),
          channelId,
          prize,
          endsAt,
          winnerCount,
        },
      });

      logger.info(`Giveaway created: ${prize}`, { guildId, duration: duration / 1000 });
      return giveaway;
    } catch (error) {
      logger.error("Failed to create giveaway", { error, guildId });
      return null;
    }
  }

  async joinGiveaway(guildId: string, giveawayId: string, userId: string): Promise<boolean> {
    try {
      await prisma.giveawayParticipant.create({
        data: {
          id: uuidv4(),
          guildId,
          giveawayId,
          userId,
        },
      });
      return true;
    } catch (error) {
      logger.error("Failed to join giveaway", { error });
      return false;
    }
  }

  async endGiveaway(giveawayId: string, winnerCount?: number): Promise<any[]> {
    try {
      const giveaway = await prisma.giveaway.findUnique({
        where: { id: giveawayId },
        include: { participants: true },
      });

      if (!giveaway) return [];

      const participants = giveaway.participants.map((p) => p.userId);
      if (participants.length === 0) return [];

      const winners: string[] = [];
      const count = Math.min(winnerCount || giveaway.winnerCount, participants.length);

      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * participants.length);
        winners.push(participants[randomIndex]);
        participants.splice(randomIndex, 1);
      }

      for (const winnerId of winners) {
        await prisma.giveawayWinner.create({
          data: {
            id: uuidv4(),
            giveawayId,
            userId: winnerId,
          },
        });
      }

      await prisma.giveaway.update({
        where: { id: giveawayId },
        data: {
          isEnded: true,
          endedAt: new Date(),
        },
      });

      logger.info(`Giveaway ended: ${giveawayId}`, { winners: winners.length });
      return winners;
    } catch (error) {
      logger.error("Failed to end giveaway", { error, giveawayId });
      return [];
    }
  }

  async getActiveGiveaways(guildId: string): Promise<any[]> {
    try {
      return await prisma.giveaway.findMany({
        where: {
          guildId,
          isEnded: false,
          endsAt: {
            gt: new Date(),
          },
        },
      });
    } catch (error) {
      logger.error("Failed to get active giveaways", { error, guildId });
      return [];
    }
  }
}

export const giveawayService = new GiveawayService();