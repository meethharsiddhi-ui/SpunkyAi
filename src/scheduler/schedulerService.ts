import { Client } from "discord.js";
import logger from "../logging/logger";
import prisma from "../database/prisma";
import { v4 as uuidv4 } from "uuid";

export class SchedulerService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  async createScheduledEvent(
    guildId: string,
    title: string,
    description: string,
    startsAt: Date,
    recurring?: string
  ): Promise<any> {
    try {
      return await prisma.scheduledEvent.create({
        data: {
          id: uuidv4(),
          guildId,
          title,
          description,
          startsAt,
          recurring,
        },
      });
    } catch (error) {
      logger.error("Failed to create scheduled event", { error, guildId });
      return null;
    }
  }

  async getUpcomingEvents(guildId: string): Promise<any[]> {
    try {
      return await prisma.scheduledEvent.findMany({
        where: {
          guildId,
          isActive: true,
          startsAt: {
            gt: new Date(),
          },
        },
        orderBy: { startsAt: "asc" },
      });
    } catch (error) {
      logger.error("Failed to get upcoming events", { error, guildId });
      return [];
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      await prisma.scheduledEvent.update({
        where: { id: eventId },
        data: { isActive: false },
      });
      return true;
    } catch (error) {
      logger.error("Failed to delete event", { error, eventId });
      return false;
    }
  }

  registerInterval(key: string, interval: NodeJS.Timeout): void {
    this.intervals.set(key, interval);
  }

  clearInterval(key: string): void {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }

  async startGiveawayChecker(client: Client): Promise<void> {
    const checkInterval = setInterval(async () => {
      try {
        const endedGiveaways = await prisma.giveaway.findMany({
          where: {
            isEnded: false,
            endsAt: {
              lte: new Date(),
            },
          },
        });

        for (const giveaway of endedGiveaways) {
          // Handle giveaway ending
          logger.info(`Giveaway ${giveaway.id} ended`);
        }
      } catch (error) {
        logger.error("Error in giveaway checker", { error });
      }
    }, 10000); // Check every 10 seconds

    this.registerInterval("giveaway-checker", checkInterval);
  }
}

export const schedulerService = new SchedulerService();