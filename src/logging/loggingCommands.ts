import { Message } from "discord.js";
import { PrefixCommand } from "../commands/baseCommand";
import { welcomeService } from "../logging/welcomeService";
import { ValidationUtils } from "../utils/validation";
import logger from "../logging/logger";

export const setupWelcomeCommand: PrefixCommand = {
  name: "setupwelcome",
  description: "Setup welcome system",
  category: "config",
  aliases: ["welcome"],
  cooldown: 5,
  requiredPermissions: [],
  adminOnly: true,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    if (args.length < 3) {
      await message.reply(
        "Usage: `?setupwelcome #channel message [auto-role-id]`\n" +
          "Example: `?setupwelcome #welcome Welcome {user} to {guild}! #role-id`"
      );
      return;
    }

    const channelId = ValidationUtils.extractChannelMention(args[0]);
    if (!channelId) {
      await message.reply("Please provide a valid channel mention.");
      return;
    }

    const welcomeMessage = args.slice(1).join(" ");
    const autoRoleId = args[args.length - 1]?.match(/\d+/)?.[0];

    try {
      const success = await welcomeService.setupWelcome(
        message.guild!.id,
        channelId,
        welcomeMessage,
        autoRoleId
      );

      if (success) {
        await message.reply(
          `✅ Welcome system setup!\n` +
            `Channel: <#${channelId}>\n` +
            `Message: ${welcomeMessage}` +
            (autoRoleId ? `\nAuto Role: <@&${autoRoleId}>` : "")
        );
      } else {
        await message.reply("❌ Failed to setup welcome system.");
      }
    } catch (error) {
      logger.error("Setup welcome command failed", { error });
      await message.reply("❌ An error occurred.");
    }
  },
};

export const setupLogsCommand: PrefixCommand = {
  name: "setuplogs",
  description: "Setup logging system",
  category: "config",
  aliases: ["logs"],
  cooldown: 5,
  requiredPermissions: [],
  adminOnly: true,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    if (args.length === 0) {
      await message.reply("Usage: `?setuplogs #log-channel`");
      return;
    }

    const logChannelId = ValidationUtils.extractChannelMention(args[0]);
    if (!logChannelId) {
      await message.reply("Please provide a valid channel mention.");
      return;
    }

    try {
      await message.guild!.guild?.update({
        logChannelId,
        loggingEnabled: true,
      });

      await message.reply(`✅ Logging setup complete! Logs will be sent to <#${logChannelId}>`);
    } catch (error) {
      logger.error("Setup logs command failed", { error });
      await message.reply("❌ Failed to setup logging.");
    }
  },
};

export const createRoleCommand: PrefixCommand = {
  name: "createrole",
  description: "Create a new role",
  category: "admin",
  aliases: ["addrole"],
  cooldown: 5,
  requiredPermissions: [],
  adminOnly: true,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    if (args.length === 0) {
      await message.reply("Usage: `?createrole <name> [color]`\nExample: `?createrole Moderator blue`");
      return;
    }

    const roleName = args[0];
    const colorStr = args[1];
    const color = colorStr ? ValidationUtils.parseColor(colorStr) : undefined;

    if (colorStr && !color) {
      await message.reply("❌ Invalid color. Use hex code or color name (red, blue, green, etc.)");
      return;
    }

    try {
      const role = await message.guild!.roles.create({
        name: roleName,
        color: (color as any) || undefined,
      });

      await message.reply(`✅ Role created: <@&${role.id}>`);
    } catch (error) {
      logger.error("Create role command failed", { error });
      await message.reply("❌ Failed to create role.");
    }
  },
};