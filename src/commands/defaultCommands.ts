import { Message } from "discord.js";
import { PrefixCommand } from "./baseCommand";
import { aiService } from "../ai/aiService";
import { GuildService } from "../database/guildService";
import logger from "../logging/logger";

export const pingCommand: PrefixCommand = {
  name: "ping",
  description: "Check bot latency",
  category: "utility",
  aliases: ["pong"],
  cooldown: 2,
  requiredPermissions: [],
  adminOnly: false,
  ownerOnly: false,
  execute: async (message: Message, _args: string[]) => {
    const sent = await message.reply("🏓 Pinging...");
    const latency = sent.createdTimestamp - message.createdTimestamp;
    const apiLatency = message.client.ws.ping;

    await sent.edit(
      `🏓 **Pong!**\nMessage Latency: ${latency}ms\nAPI Latency: ${apiLatency}ms`
    );
  },
};

export const helpCommand: PrefixCommand = {
  name: "help",
  description: "Show available commands",
  category: "utility",
  aliases: ["h", "commands"],
  cooldown: 2,
  requiredPermissions: [],
  adminOnly: false,
  ownerOnly: false,
  execute: async (message: Message, _args: string[]) => {
    const embed = {
      color: 0x0099ff,
      title: "📚 SpunkyAI Commands",
      description: "Here are all available commands:",
      fields: [
        {
          name: "🛠️ Utility",
          value: "`?ping` - Check bot latency\n`?help` - Show this message",
        },
        {
          name: "🤖 AI",
          value: "`?ask [question]` - Ask SpunkyAI anything\n`?clear` - Clear conversation history",
        },
        {
          name: "⚙️ Config",
          value: "`?prefix [new prefix]` - Change command prefix\n`?setup` - Setup bot for your server",
        },
      ],
      footer: {
        text: "Use ?help [command] for more info",
      },
    };

    await message.reply({ embeds: [embed] });
  },
};

export const askCommand: PrefixCommand = {
  name: "ask",
  description: "Ask SpunkyAI a question",
  category: "ai",
  aliases: ["ai", "question"],
  cooldown: 3,
  requiredPermissions: [],
  adminOnly: false,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    if (args.length === 0) {
      await message.reply("Please ask a question! Example: `?ask What is the weather?`");
      return;
    }

    const question = args.join(" ");
    const thinking = await message.reply("🤔 Thinking...");

    try {
      const { response } = await aiService.processUserMessage(
        question,
        message.guild?.id || "",
        message.author.id,
        message.author.username
      );

      if (!response) {
        await thinking.edit("❌ Failed to generate response. Please try again.");
        return;
      }

      // Split response if it's too long
      if (response.length > 2000) {
        const chunks = response.match(/[\s\S]{1,2000}/g) || [];
        await thinking.delete();
        for (const chunk of chunks) {
          await message.reply(chunk);
        }
      } else {
        await thinking.edit(response);
      }
    } catch (error) {
      logger.error("Ask command failed", { error });
      await thinking.edit("❌ An error occurred while processing your question.");
    }
  },
};

export const clearCommand: PrefixCommand = {
  name: "clear",
  description: "Clear AI conversation history",
  category: "ai",
  aliases: ["clearmemory"],
  cooldown: 2,
  requiredPermissions: [],
  adminOnly: false,
  ownerOnly: false,
  execute: async (message: Message, _args: string[]) => {
    aiService.clearHistory(message.guild?.id || "", message.author.id);
    await message.reply("✅ Conversation history cleared!");
  },
};

export const prefixCommand: PrefixCommand = {
  name: "prefix",
  description: "Change command prefix",
  category: "config",
  aliases: ["setprefix"],
  cooldown: 5,
  requiredPermissions: [],
  adminOnly: true,
  ownerOnly: false,
  execute: async (message: Message, args: string[]) => {
    if (!args.length) {
      await message.reply("Please provide a new prefix. Example: `?prefix !`");
      return;
    }

    const newPrefix = args[0];

    if (newPrefix.length > 3) {
      await message.reply("Prefix must be 3 characters or less.");
      return;
    }

    try {
      await GuildService.updateGuild(message.guild!.id, { prefix: newPrefix });
      await message.reply(`✅ Prefix changed to \`${newPrefix}\``);
    } catch (error) {
      logger.error("Failed to change prefix", { error });
      await message.reply("❌ Failed to change prefix.");
    }
  },
};