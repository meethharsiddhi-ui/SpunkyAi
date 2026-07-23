import { Message } from "discord.js";
import { PrefixCommand } from "../commands/baseCommand";
import { giveawayService } from "../giveaways/giveawayService";
import { ValidationUtils } from "../utils/validation";
import logger from "../logging/logger";

export const giveawayCommand: PrefixCommand = {
  name: "giveaway",
  description: "Create a giveaway",
  category: "giveaway",
  aliases: ["ga"],
  cooldown: 5,
  requiredPermissions: [],
  adminOnly: true,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    if (args.length < 3) {
      await message.reply(
        "Usage: `?giveaway #channel prize duration [winners]`\n" +
          "Example: `?giveaway #giveaways nitro 24h 1`"
      );
      return;
    }

    const channelId = ValidationUtils.extractChannelMention(args[0]);
    if (!channelId) {
      await message.reply("Please provide a valid channel.");
      return;
    }

    const prize = args[1];
    const duration = ValidationUtils.parseTime(args[2]);
    const winners = parseInt(args[3]) || 1;

    if (!duration) {
      await message.reply("Invalid duration format. Use: 10s, 5m, 2h, 1d");
      return;
    }

    try {
      const giveaway = await giveawayService.createGiveaway(
        message.guild!.id,
        channelId,
        prize,
        duration,
        winners
      );

      if (giveaway) {
        const endTime = Math.floor(new Date(giveaway.endsAt).getTime() / 1000);
        await message.reply(
          `🎉 **Giveaway Created!**\n` +
            `Prize: ${prize}\n` +
            `Winners: ${winners}\n` +
            `Ends: <t:${endTime}:R>`
        );
      } else {
        await message.reply("❌ Failed to create giveaway.");
      }
    } catch (error) {
      logger.error("Giveaway command failed", { error });
      await message.reply("❌ An error occurred.");
    }
  },
};

export const ticketCommand: PrefixCommand = {
  name: "ticket",
  description: "Create a support ticket",
  category: "tickets",
  aliases: ["support"],
  cooldown: 5,
  requiredPermissions: [],
  adminOnly: false,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    const reason = args.join(" ") || "No reason provided";

    try {
      const channel = await message.guild!.channels.create({
        name: `ticket-${message.author.username}`,
        topic: `Support ticket for ${message.author.username}`,
      });

      const embed = {
        color: 0x0099ff,
        title: "🎫 Support Ticket Created",
        description: `Ticket created by ${message.author}`,
        fields: [
          { name: "Reason", value: reason, inline: false },
          { name: "Channel", value: `<#${channel.id}>`, inline: true },
        ],
      };

      await message.reply({ embeds: [embed] });
      await channel.send(`Welcome ${message.author}! Support team will be with you shortly.`);
    } catch (error) {
      logger.error("Ticket command failed", { error });
      await message.reply("❌ Failed to create ticket.");
    }
  },
};

export const backupCommand: PrefixCommand = {
  name: "backup",
  description: "Backup server configuration",
  category: "admin",
  aliases: ["bak"],
  cooldown: 10,
  requiredPermissions: [],
  adminOnly: true,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    const action = args[0]?.toLowerCase();

    if (action === "create") {
      try {
        const backupService = (await import("../backup/backupService")).backupService;
        const backup = await backupService.createBackup(message.guild!.id, message.author.id);

        if (backup) {
          await message.reply(`✅ Backup created: **${backup.name}**\nSize: ${(backup.size / 1024).toFixed(2)} KB`);
        } else {
          await message.reply("❌ Failed to create backup.");
        }
      } catch (error) {
        logger.error("Backup create failed", { error });
        await message.reply("❌ An error occurred.");
      }
    } else if (action === "list") {
      try {
        const backupService = (await import("../backup/backupService")).backupService;
        const backups = await backupService.getBackups(message.guild!.id);

        if (backups.length === 0) {
          await message.reply("No backups found.");
          return;
        }

        const list = backups
          .slice(0, 10)
          .map((b, i) => `**${i + 1}.** ${b.name} - <t:${Math.floor(b.createdAt.getTime() / 1000)}:R>`)
          .join("\n");

        await message.reply(`📦 **Backups:**\n${list}`);
      } catch (error) {
        logger.error("Backup list failed", { error });
        await message.reply("❌ An error occurred.");
      }
    } else {
      await message.reply("Usage: `?backup create` or `?backup list`");
    }
  },
};

export const minecraftCommand: PrefixCommand = {
  name: "minecraft",
  description: "Check Minecraft server status",
  category: "games",
  aliases: ["mc"],
  cooldown: 5,
  requiredPermissions: [],
  adminOnly: false,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    if (args.length < 1) {
      await message.reply(
        "Usage: `?minecraft <host> [port] [java|bedrock]`\n" +
          "Example: `?minecraft mc.hypixel.net 25565 java`"
      );
      return;
    }

    const host = args[0];
    const port = parseInt(args[1]) || 25565;
    const type = (args[2] || "java").toLowerCase();

    try {
      const minecraftService = (await import("../minecraft/minecraftService")).minecraftService;
      const status =
        type === "bedrock"
          ? await minecraftService.getBedrockServerStatus(host, port)
          : await minecraftService.getJavaServerStatus(host, port);

      if (!status) {
        await message.reply("❌ Could not reach server.");
        return;
      }

      const embed = {
        color: status.online ? 0x51cf66 : 0xff6b6b,
        title: `🎮 ${host}:${port}`,
        fields: [
          {
            name: "Status",
            value: status.online ? "✅ Online" : "❌ Offline",
            inline: true,
          },
          {
            name: "Players",
            value: `${status.players}/${status.maxPlayers}`,
            inline: true,
          },
          { name: "MOTD", value: status.motd || "No MOTD", inline: false },
          { name: "Ping", value: `${status.ping}ms`, inline: true },
        ],
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      logger.error("Minecraft command failed", { error });
      await message.reply("❌ An error occurred.");
    }
  },
};

export const inviteCommand: PrefixCommand = {
  name: "invites",
  description: "Show invite leaderboard",
  category: "utility",
  aliases: ["invitelb"],
  cooldown: 5,
  requiredPermissions: [],
  adminOnly: false,
  ownerOnly: false,
  execute: async (message: Message, _args: string[]) => {
    try {
      const inviteService = (await import("../invites/inviteService")).inviteService;
      const leaderboard = await inviteService.getInviteLeaderboard(message.guild!.id, 10);

      if (leaderboard.length === 0) {
        await message.reply("No invites tracked yet.");
        return;
      }

      const list = leaderboard
        .map((inv, i) => `**${i + 1}.** <@${inv.creatorId}> - ${inv.uses} invites`)
        .join("\n");

      const embed = {
        color: 0x0099ff,
        title: "🔗 Invite Leaderboard",
        description: list,
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      logger.error("Invite command failed", { error });
      await message.reply("❌ An error occurred.");
    }
  },
};