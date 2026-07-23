import { Client, Events, ChannelType } from "discord.js";
import logger from "../logging/logger";
import prisma from "../database/prisma";
import { v4 as uuidv4 } from "uuid";

export async function setupWelcomeEvents(client: Client): Promise<void> {
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      const welcomeConfig = await prisma.welcomeConfig.findUnique({
        where: { guildId: member.guild.id },
      });

      if (!welcomeConfig?.enabled) return;

      // Send welcome message
      if (welcomeConfig.channelId && welcomeConfig.message) {
        const channel = member.guild.channels.cache.get(welcomeConfig.channelId);
        if (channel?.isTextBased()) {
          const message = welcomeConfig.message
            .replace(/{user}/g, `<@${member.id}>`)
            .replace(/{guild}/g, member.guild.name)
            .replace(/{count}/g, member.guild.memberCount.toString());

          await channel.send(message);
        }
      }

      // Send DM
      if (welcomeConfig.sendDM && welcomeConfig.dmMessage) {
        try {
          const dmMessage = welcomeConfig.dmMessage
            .replace(/{user}/g, member.user.username)
            .replace(/{guild}/g, member.guild.name);

          await member.send(dmMessage);
        } catch (error) {
          logger.warn("Failed to send welcome DM", { userId: member.id });
        }
      }

      // Auto assign role
      if (welcomeConfig.autoRoleId) {
        try {
          const role = member.guild.roles.cache.get(welcomeConfig.autoRoleId);
          if (role) {
            await member.roles.add(role);
          }
        } catch (error) {
          logger.warn("Failed to assign auto role", { userId: member.id });
        }
      }
    } catch (error) {
      logger.error("Failed to handle welcome event", { error });
    }
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    try {
      const welcomeConfig = await prisma.welcomeConfig.findUnique({
        where: { guildId: member.guild.id },
      });

      if (!welcomeConfig?.enabled || !welcomeConfig.goodbyeChannelId || !welcomeConfig.goodbyeMessage) return;

      const channel = member.guild.channels.cache.get(welcomeConfig.goodbyeChannelId);
      if (!channel?.isTextBased()) return;

      const message = welcomeConfig.goodbyeMessage
        .replace(/{user}/g, member.user.username)
        .replace(/{guild}/g, member.guild.name);

      await channel.send(message);
    } catch (error) {
      logger.error("Failed to handle goodbye event", { error });
    }
  });

  logger.info("Welcome events setup complete");
}
