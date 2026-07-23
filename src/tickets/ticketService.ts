import { Guild } from "discord.js";
import logger from "../logging/logger";
import prisma from "../database/prisma";
import { v4 as uuidv4 } from "uuid";

export class TicketService {
  async createTicket(
    guild: Guild,
    userId: string,
    userName: string,
    type: string,
    reason?: string
  ): Promise<any> {
    try {
      const channel = await guild.channels.create({
        name: `ticket-${userName}`,
        topic: `Ticket for ${userName} - Type: ${type}`,
      });

      const ticket = await prisma.ticket.create({
        data: {
          id: uuidv4(),
          guildId: guild.id,
          channelId: channel.id,
          creatorId: userId,
          creatorName: userName,
          type,
          reason,
        },
      });

      logger.info(`Ticket created: ${type}`, { guildId: guild.id, userId });
      return ticket;
    } catch (error) {
      logger.error("Failed to create ticket", { error, guildId: guild.id });
      return null;
    }
  }

  async closeTicket(ticketId: string): Promise<boolean> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) return false;

      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          isClosed: true,
          closedAt: new Date(),
        },
      });

      logger.info(`Ticket closed: ${ticketId}`);
      return true;
    } catch (error) {
      logger.error("Failed to close ticket", { error, ticketId });
      return false;
    }
  }

  async assignTicket(ticketId: string, assigneeId: string): Promise<boolean> {
    try {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          assigneeId,
        },
      });
      return true;
    } catch (error) {
      logger.error("Failed to assign ticket", { error, ticketId });
      return false;
    }
  }

  async getTickets(guildId: string, isClosed?: boolean): Promise<any[]> {
    try {
      return await prisma.ticket.findMany({
        where: {
          guildId,
          isClosed: isClosed ?? false,
        },
      });
    } catch (error) {
      logger.error("Failed to get tickets", { error, guildId });
      return [];
    }
  }
}

export const ticketService = new TicketService();