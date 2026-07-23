import { Client, Events, Message } from "discord.js";
import { commandManager } from "../commands/commandManager";
import { aiService } from "../ai/aiService";
import logger from "../logging/logger";
import { GuildService } from "../database/guildService";
import { MemberService } from "../database/memberService";
import config from "../config/config";

export async function setupMessageEvents(client: Client): Promise<void> {
  client.on(Events.MessageCreate, async (message: Message) => {
    try {
      // Ignore bot messages
      if (message.author.bot) return;
      if (!message.guild) return;

      // Ensure guild exists in database
      await GuildService.getOrCreateGuild(message.guild);
      await MemberService.getOrCreateMember(message.guild.id, message.author.id);

      // Check if it's a prefix command
      if (message.content.startsWith(config.discord.prefix)) {
        await commandManager.handleMessage(message);
        return;
      }

      // AI conversation mode (if message mentions bot or in AI channel)
      if (message.mentions.has(client.user!.id)) {
        const content = message.content
          .replace(new RegExp(`<@!?${client.user!.id}>`), "")
          .trim();

        const thinking = await message.reply("🤔 Thinking...").catch(() => null);

        const { response } = await aiService.processUserMessage(
          content,
          message.guild.id,
          message.author.id,
          message.author.username
        );

        if (thinking) {
          if (response) {
            if (response.length > 2000) {
              const chunks = response.match(/[\s\S]{1,2000}/g) || [];
              await thinking.delete();
              for (const chunk of chunks) {
                await message.reply(chunk);
              }
            } else {
              await thinking.edit(response);
            }
          } else {
            await thinking.edit("❌ Failed to generate response.");
          }
        }
      }
    } catch (error) {
      logger.error("Error handling message", { error, messageId: message.id });
    }
  });

  logger.info("Message events setup complete");
}
