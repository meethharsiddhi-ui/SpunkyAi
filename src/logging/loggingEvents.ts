import { Client, Events, AuditLogEvent } from "discord.js";
import logger from "../logging/logger";
import prisma from "../database/prisma";
import { v4 as uuidv4 } from "uuid";

export async function setupLoggingEvents(client: Client): Promise<void> {
  // Message Delete Logs
  client.on(Events.MessageDelete, async (message) => {
    try {
      if (!message.guild) return;

      const guild = await prisma.guild.findUnique({
        where: { id: message.guild.id },
      });

      if (!guild?.loggingEnabled || !guild.logChannelId) return;

      const logChannel = message.guild.channels.cache.get(guild.logChannelId);
      if (!logChannel || !logChannel.isTextBased()) return;

      const embed = {
        color: 0xff6b6b,
        title: "📛 Message Deleted",
        fields: [
          { name: "Author", value: `<@${message.author?.id}>`, inline: true },
          { name: "Channel", value: `<#${message.channelId}>`, inline: true },
          { name: "Content", value: message.content || "[No content]", inline: false },
        ],
        timestamp: new Date().toISOString(),
      };

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      logger.error("Failed to log message delete", { error });
    }
  });

  // Message Edit Logs
  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    try {
      if (!newMessage.guild || oldMessage.content === newMessage.content) return;

      const guild = await prisma.guild.findUnique({
        where: { id: newMessage.guild.id },
      });

      if (!guild?.loggingEnabled || !guild.logChannelId) return;

      const logChannel = newMessage.guild.channels.cache.get(guild.logChannelId);
      if (!logChannel || !logChannel.isTextBased()) return;

      const embed = {
        color: 0xffd700,
        title: "✏️ Message Edited",
        fields: [
          { name: "Author", value: `<@${newMessage.author.id}>`, inline: true },
          { name: "Channel", value: `<#${newMessage.channelId}>`, inline: true },
          { name: "Old Content", value: oldMessage.content || "[No content]", inline: false },
          { name: "New Content", value: newMessage.content || "[No content]", inline: false },
        ],
        timestamp: new Date().toISOString(),
      };

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      logger.error("Failed to log message edit", { error });
    }
  });

  // Member Join Logs
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      const guild = await prisma.guild.findUnique({
        where: { id: member.guild.id },
      });

      if (!guild?.loggingEnabled || !guild.joinLogChannelId) return;

      const logChannel = member.guild.channels.cache.get(guild.joinLogChannelId);
      if (!logChannel || !logChannel.isTextBased()) return;

      const embed = {
        color: 0x51cf66,
        title: "👋 Member Joined",
        fields: [
          { name: "User", value: `<@${member.id}>`, inline: true },
          { name: "Account Age", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "Total Members", value: member.guild.memberCount.toString(), inline: true },
        ],
        timestamp: new Date().toISOString(),
      };

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      logger.error("Failed to log member join", { error });
    }
  });

  // Member Leave Logs
  client.on(Events.GuildMemberRemove, async (member) => {
    try {
      const guild = await prisma.guild.findUnique({
        where: { id: member.guild.id },
      });

      if (!guild?.loggingEnabled || !guild.leaveLogChannelId) return;

      const logChannel = member.guild.channels.cache.get(guild.leaveLogChannelId);
      if (!logChannel || !logChannel.isTextBased()) return;

      const embed = {
        color: 0xff8787,
        title: "👋 Member Left",
        fields: [
          { name: "User", value: `<@${member.id}>`, inline: true },
          { name: "Roles", value: member.roles.cache.size.toString(), inline: true },
          { name: "Total Members", value: member.guild.memberCount.toString(), inline: true },
        ],
        timestamp: new Date().toISOString(),
      };

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      logger.error("Failed to log member leave", { error });
    }
  });

  // Role Update Logs
  client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
    try {
      const guild = await prisma.guild.findUnique({
        where: { id: newRole.guild.id },
      });

      if (!guild?.loggingEnabled || !guild.modLogChannelId) return;

      const logChannel = newRole.guild.channels.cache.get(guild.modLogChannelId);
      if (!logChannel || !logChannel.isTextBased()) return;

      const embed = {
        color: 0x1e90ff,
        title: "🔄 Role Updated",
        fields: [
          { name: "Role", value: `<@&${newRole.id}>`, inline: true },
          { name: "Name", value: `${oldRole.name} → ${newRole.name}`, inline: true },
          { name: "Color", value: `${oldRole.hexColor} → ${newRole.hexColor}`, inline: true },
        ],
        timestamp: new Date().toISOString(),
      };

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      logger.error("Failed to log role update", { error });
    }
  });

  logger.info("Logging events setup complete");
}
