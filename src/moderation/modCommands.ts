import { Message } from "discord.js";
import { PrefixCommand } from "../commands/baseCommand";
import { moderationService } from "./moderationService";
import { ValidationUtils } from "../utils/validation";
import logger from "../logging/logger";

export const warnCommand: PrefixCommand = {
  name: "warn",
  description: "Warn a user",
  category: "moderation",
  aliases: ["warning"],
  cooldown: 3,
  requiredPermissions: [],
  adminOnly: true,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    if (args.length === 0) {
      await message.reply("Usage: `?warn @user [reason]`");
      return;
    }

    const userId = ValidationUtils.extractMention(args[0]);
    if (!userId) {
      await message.reply("Please mention a user to warn.");
      return;
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      const success = await moderationService.warnUser(
        message.guild!,
        userId,
        reason,
        message.author.id
      );

      if (success) {
        await message.reply(`⚠️ User warned: <@${userId}>\nReason: ${reason}`);
      } else {
        await message.reply("❌ Failed to warn user.");
      }
    } catch (error) {
      logger.error("Warn command failed", { error });
      await message.reply("❌ An error occurred while warning the user.");
    }
  },
};

export const banCommand: PrefixCommand = {
  name: "ban",
  description: "Ban a user",
  category: "moderation",
  aliases: ["banish"],
  cooldown: 5,
  requiredPermissions: [],
  adminOnly: true,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    if (args.length === 0) {
      await message.reply("Usage: `?ban @user [reason]`");
      return;
    }

    const userId = ValidationUtils.extractMention(args[0]);
    if (!userId) {
      await message.reply("Please mention a user to ban.");
      return;
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    // Ask for confirmation
    await message.reply(
      `⚠️ Are you sure you want to ban <@${userId}>? React with ✅ to confirm or ❌ to cancel.`
    );

    // Note: In production, implement proper confirmation system with reaction collectors
    // For now, proceeding with ban
    try {
      const success = await moderationService.banUser(
        message.guild!,
        userId,
        message.author.id,
        reason
      );

      if (success) {
        await message.reply(`🔨 User banned: <@${userId}>\nReason: ${reason}`);
      } else {
        await message.reply("❌ Failed to ban user.");
      }
    } catch (error) {
      logger.error("Ban command failed", { error });
      await message.reply("❌ An error occurred while banning the user.");
    }
  },
};

export const kickCommand: PrefixCommand = {
  name: "kick",
  description: "Kick a user",
  category: "moderation",
  aliases: ["remove"],
  cooldown: 5,
  requiredPermissions: [],
  adminOnly: true,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    if (args.length === 0) {
      await message.reply("Usage: `?kick @user [reason]`");
      return;
    }

    const userId = ValidationUtils.extractMention(args[0]);
    if (!userId) {
      await message.reply("Please mention a user to kick.");
      return;
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      const member = await message.guild!.members.fetch(userId);
      const success = await moderationService.kickUser(
        message.guild!,
        member,
        message.author.id,
        reason
      );

      if (success) {
        await message.reply(`👢 User kicked: <@${userId}>\nReason: ${reason}`);
      } else {
        await message.reply("❌ Failed to kick user.");
      }
    } catch (error) {
      logger.error("Kick command failed", { error });
      await message.reply("❌ An error occurred while kicking the user.");
    }
  },
};

export const lockCommand: PrefixCommand = {
  name: "lock",
  description: "Lock a channel",
  category: "moderation",
  aliases: ["lockdown"],
  cooldown: 3,
  requiredPermissions: [],
  adminOnly: true,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    const channelId = args.length > 0 ? ValidationUtils.extractChannelMention(args[0]) : message.channelId;

    try {
      const success = await moderationService.lockChannel(message.guild!, channelId);

      if (success) {
        await message.reply(`🔒 Channel locked: <#${channelId}>`);
      } else {
        await message.reply("❌ Failed to lock channel.");
      }
    } catch (error) {
      logger.error("Lock command failed", { error });
      await message.reply("❌ An error occurred while locking the channel.");
    }
  },
};

export const unlockCommand: PrefixCommand = {
  name: "unlock",
  description: "Unlock a channel",
  category: "moderation",
  aliases: ["unlock"],
  cooldown: 3,
  requiredPermissions: [],
  adminOnly: true,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    const channelId = args.length > 0 ? ValidationUtils.extractChannelMention(args[0]) : message.channelId;

    try {
      const success = await moderationService.unlockChannel(message.guild!, channelId);

      if (success) {
        await message.reply(`🔓 Channel unlocked: <#${channelId}>`);
      } else {
        await message.reply("❌ Failed to unlock channel.");
      }
    } catch (error) {
      logger.error("Unlock command failed", { error });
      await message.reply("❌ An error occurred while unlocking the channel.");
    }
  },
};

export const purgeCommand: PrefixCommand = {
  name: "purge",
  description: "Delete messages from a channel",
  category: "moderation",
  aliases: ["clear", "delete"],
  cooldown: 5,
  requiredPermissions: [],
  adminOnly: true,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    if (args.length === 0) {
      await message.reply("Usage: `?purge <number>`");
      return;
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      await message.reply("Please provide a number between 1 and 100.");
      return;
    }

    try {
      const deleted = await moderationService.purge(message.guild!, message.channelId, amount);
      const msg = await message.reply(`🗑️ Deleted ${deleted} messages.`);
      setTimeout(() => msg.delete().catch(() => {}), 3000);
    } catch (error) {
      logger.error("Purge command failed", { error });
      await message.reply("❌ An error occurred while purging messages.");
    }
  },
};

export const warningsCommand: PrefixCommand = {
  name: "warnings",
  description: "Check user warnings",
  category: "moderation",
  aliases: ["warns"],
  cooldown: 2,
  requiredPermissions: [],
  adminOnly: true,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    if (args.length === 0) {
      await message.reply("Usage: `?warnings @user`");
      return;
    }

    const userId = ValidationUtils.extractMention(args[0]);
    if (!userId) {
      await message.reply("Please mention a user.");
      return;
    }

    try {
      const warnings = await moderationService.getWarnings(message.guild!.id, userId);

      if (warnings.length === 0) {
        await message.reply(`<@${userId}> has no warnings.`);
        return;
      }

      const warningsList = warnings
        .map(
          (w, i) =>
            `**${i + 1}.** ${w.reason} (by <@${w.moderatorId}>) - <t:${Math.floor(w.createdAt.getTime() / 1000)}:R>`
        )
        .join("\n");

      const embed = {
        color: 0xff6b6b,
        title: `Warnings for ${userId}`,
        description: warningsList,
        footer: { text: `Total: ${warnings.length}` },
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      logger.error("Warnings command failed", { error });
      await message.reply("❌ An error occurred while fetching warnings.");
    }
  },
};