import { Guild, PermissionFlagsBits, ColorResolvable } from "discord.js";
import logger from "../logging/logger";
import prisma from "../database/prisma";
import { v4 as uuidv4 } from "uuid";

export class ServerManagementService {
  async createRole(
    guild: Guild,
    name: string,
    options?: {
      color?: string;
      hoist?: boolean;
      mentionable?: boolean;
    }
  ): Promise<any> {
    try {
      const botMember = await guild.members.fetchMe();
      if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return null;
      }

      const role = await guild.roles.create({
        name,
        color: (options?.color as ColorResolvable) || "Default",
        hoist: options?.hoist ?? false,
        mentionable: options?.mentionable ?? false,
      });

      await prisma.guildRole.create({
        data: {
          id: uuidv4(),
          guildId: guild.id,
          roleId: role.id,
          name: role.name,
          color: role.hexColor,
        },
      });

      logger.info(`Role created: ${name}`, { guildId: guild.id, roleId: role.id });
      return role;
    } catch (error) {
      logger.error("Failed to create role", { error, guildId: guild.id, roleName: name });
      return null;
    }
  }

  async deleteRole(guild: Guild, roleId: string): Promise<boolean> {
    try {
      const botMember = await guild.members.fetchMe();
      if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return false;
      }

      const role = guild.roles.cache.get(roleId);
      if (!role) return false;

      if (role.position >= botMember.roles.highest.position) {
        return false;
      }

      await role.delete();

      await prisma.guildRole.delete({
        where: {
          guildId_roleId: { guildId: guild.id, roleId },
        },
      }).catch(() => {});

      logger.info(`Role deleted: ${roleId}`, { guildId: guild.id });
      return true;
    } catch (error) {
      logger.error("Failed to delete role", { error, guildId: guild.id });
      return false;
    }
  }

  async createChannel(
    guild: Guild,
    name: string,
    type: "text" | "voice" | "category" = "text"
  ): Promise<any> {
    try {
      const botMember = await guild.members.fetchMe();
      if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return null;
      }

      const channel = await guild.channels.create({
        name,
        type: type === "text" ? 0 : type === "voice" ? 2 : 4,
      });

      await prisma.guildChannel.create({
        data: {
          id: uuidv4(),
          guildId: guild.id,
          channelId: channel.id,
          name: channel.name,
          type,
        },
      });

      logger.info(`Channel created: ${name}`, { guildId: guild.id, channelId: channel.id });
      return channel;
    } catch (error) {
      logger.error("Failed to create channel", { error, guildId: guild.id });
      return null;
    }
  }

  async deleteChannel(guild: Guild, channelId: string): Promise<boolean> {
    try {
      const botMember = await guild.members.fetchMe();
      if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return false;
      }

      const channel = guild.channels.cache.get(channelId);
      if (!channel) return false;

      await channel.delete();

      await prisma.guildChannel.delete({
        where: {
          guildId_channelId: { guildId: guild.id, channelId },
        },
      }).catch(() => {});

      logger.info(`Channel deleted: ${channelId}`, { guildId: guild.id });
      return true;
    } catch (error) {
      logger.error("Failed to delete channel", { error, guildId: guild.id });
      return false;
    }
  }

  async assignRole(guild: Guild, userId: string, roleId: string): Promise<boolean> {
    try {
      const member = await guild.members.fetch(userId);
      const botMember = await guild.members.fetchMe();

      if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return false;
      }

      const role = guild.roles.cache.get(roleId);
      if (!role || role.position >= botMember.roles.highest.position) {
        return false;
      }

      await member.roles.add(role);
      return true;
    } catch (error) {
      logger.error("Failed to assign role", { error, guildId: guild.id, userId });
      return false;
    }
  }

  async removeRole(guild: Guild, userId: string, roleId: string): Promise<boolean> {
    try {
      const member = await guild.members.fetch(userId);
      const botMember = await guild.members.fetchMe();

      if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return false;
      }

      const role = guild.roles.cache.get(roleId);
      if (!role) return false;

      await member.roles.remove(role);
      return true;
    } catch (error) {
      logger.error("Failed to remove role", { error, guildId: guild.id });
      return false;
    }
  }
}

export const serverManagementService = new ServerManagementService();