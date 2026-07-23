import { Guild, GuildMember, PermissionFlagsBits } from "discord.js";
import logger from "../logging/logger";
import prisma from "../database/prisma";
import { v4 as uuidv4 } from "uuid";

export class ModerationService {
  async banUser(
    guild: Guild,
    targetId: string,
    moderatorId: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const botMember = await guild.members.fetchMe();
      if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
        logger.warn("Bot missing BAN_MEMBERS permission");
        return false;
      }

      await guild.bans.create(targetId, { reason });

      // Log action
      await prisma.modAction.create({
        data: {
          id: uuidv4(),
          guildId: guild.id,
          targetId,
          moderatorId,
          action: "ban",
          reason,
        },
      });

      logger.info(`User banned: ${targetId}`, { guildId: guild.id, reason });
      return true;
    } catch (error) {
      logger.error("Failed to ban user", { error, targetId, guildId: guild.id });
      return false;
    }
  }

  async kickUser(
    guild: Guild,
    member: GuildMember,
    moderatorId: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const botMember = await guild.members.fetchMe();
      if (!botMember.permissions.has(PermissionFlagsBits.KickMembers)) {
        return false;
      }

      if (member.roles.highest.position >= botMember.roles.highest.position) {
        return false;
      }

      await member.kick(reason);

      await prisma.modAction.create({
        data: {
          id: uuidv4(),
          guildId: guild.id,
          targetId: member.id,
          moderatorId,
          action: "kick",
          reason,
        },
      });

      logger.info(`User kicked: ${member.id}`, { guildId: guild.id, reason });
      return true;
    } catch (error) {
      logger.error("Failed to kick user", { error, memberId: member.id });
      return false;
    }
  }

  async timeoutUser(
    guild: Guild,
    member: GuildMember,
    duration: number,
    moderatorId: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const botMember = await guild.members.fetchMe();
      if (!botMember.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return false;
      }

      if (member.roles.highest.position >= botMember.roles.highest.position) {
        return false;
      }

      const expiresAt = new Date(Date.now() + duration);
      await member.timeout(duration, reason);

      await prisma.modAction.create({
        data: {
          id: uuidv4(),
          guildId: guild.id,
          targetId: member.id,
          moderatorId,
          action: "timeout",
          reason,
          duration,
          expiresAt,
        },
      });

      return true;
    } catch (error) {
      logger.error("Failed to timeout user", { error, memberId: member.id });
      return false;
    }
  }

  async warnUser(
    guild: Guild,
    userId: string,
    reason: string,
    moderatorId?: string
  ): Promise<boolean> {
    try {
      const warning = await prisma.warning.create({
        data: {
          id: uuidv4(),
          guildId: guild.id,
          userId,
          reason,
          moderatorId,
          severity: 1,
        },
      });

      const warnCount = await prisma.warning.count({
        where: { guildId: guild.id, userId },
      });

      await prisma.guildMember.update({
        where: {
          guildId_userId: { guildId: guild.id, userId },
        },
        data: { warnCount },
      });

      logger.info(`User warned: ${userId}`, { guildId: guild.id, reason, warnCount });
      return true;
    } catch (error) {
      logger.error("Failed to warn user", { error, userId, guildId: guild.id });
      return false;
    }
  }

  async lockChannel(guild: Guild, channelId: string): Promise<boolean> {
    try {
      const channel = guild.channels.cache.get(channelId);
      if (!channel || !channel.isTextBased()) return false;

      const botMember = await guild.members.fetchMe();
      if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return false;
      }

      const everyone = guild.roles.everyone;
      await channel.permissionOverwrites.edit(everyone, {
        SendMessages: false,
      });

      await prisma.guildChannel.update({
        where: {
          guildId_channelId: { guildId: guild.id, channelId },
        },
        data: { isLocked: true },
      });

      logger.info(`Channel locked: ${channelId}`, { guildId: guild.id });
      return true;
    } catch (error) {
      logger.error("Failed to lock channel", { error, channelId, guildId: guild.id });
      return false;
    }
  }

  async unlockChannel(guild: Guild, channelId: string): Promise<boolean> {
    try {
      const channel = guild.channels.cache.get(channelId);
      if (!channel || !channel.isTextBased()) return false;

      const botMember = await guild.members.fetchMe();
      if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return false;
      }

      const everyone = guild.roles.everyone;
      await channel.permissionOverwrites.edit(everyone, {
        SendMessages: true,
      });

      await prisma.guildChannel.update({
        where: {
          guildId_channelId: { guildId: guild.id, channelId },
        },
        data: { isLocked: false },
      });

      logger.info(`Channel unlocked: ${channelId}`, { guildId: guild.id });
      return true;
    } catch (error) {
      logger.error("Failed to unlock channel", { error, channelId });
      return false;
    }
  }

  async slowmode(guild: Guild, channelId: string, seconds: number): Promise<boolean> {
    try {
      const channel = guild.channels.cache.get(channelId);
      if (!channel || !channel.isTextBased()) return false;

      const botMember = await guild.members.fetchMe();
      if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return false;
      }

      await channel.setRateLimitPerUser(seconds);

      await prisma.guildChannel.update({
        where: {
          guildId_channelId: { guildId: guild.id, channelId },
        },
        data: { slowmode: seconds },
      });

      return true;
    } catch (error) {
      logger.error("Failed to set slowmode", { error, channelId });
      return false;
    }
  }

  async purge(guild: Guild, channelId: string, amount: number): Promise<number> {
    try {
      const channel = guild.channels.cache.get(channelId);
      if (!channel || !channel.isTextBased()) return 0;

      const botMember = await guild.members.fetchMe();
      if (!botMember.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return 0;
      }

      const deleted = await channel.bulkDelete(Math.min(amount, 100));
      logger.info(`Purged messages: ${deleted.size}`, { guildId: guild.id, channelId });
      return deleted.size;
    } catch (error) {
      logger.error("Failed to purge messages", { error, channelId });
      return 0;
    }
  }

  async getWarnings(guildId: string, userId: string): Promise<any[]> {
    try {
      return await prisma.warning.findMany({
        where: { guildId, userId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error("Failed to get warnings", { error, userId, guildId });
      return [];
    }
  }

  async removeWarning(warningId: string): Promise<boolean> {
    try {
      await prisma.warning.delete({
        where: { id: warningId },
      });
      return true;
    } catch (error) {
      logger.error("Failed to remove warning", { error, warningId });
      return false;
    }
  }
}

export const moderationService = new ModerationService();