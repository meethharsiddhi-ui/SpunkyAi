import { Collection, Message } from "discord.js";
import { PrefixCommand } from "./baseCommand";
import logger from "../logging/logger";
import { RateLimiter } from "../utils/rateLimiter";
import { PermissionValidator } from "../utils/permissions";
import config from "../config/config";

export class CommandManager {
  private commands: Collection<string, PrefixCommand> = new Collection();
  private aliases: Collection<string, string> = new Collection();
  private rateLimiter: RateLimiter = new RateLimiter();

  register(command: PrefixCommand): void {
    this.commands.set(command.name, command);

    command.aliases.forEach((alias) => {
      this.aliases.set(alias, command.name);
    });

    logger.info(`Command registered: ${command.name}`);
  }

  async handleMessage(message: Message): Promise<void> {
    if (!message.content.startsWith(config.discord.prefix)) return;
    if (message.author.bot) return;

    const args = message.content
      .slice(config.discord.prefix.length)
      .trim()
      .split(/\s+/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    // Check if it's an alias or command
    const resolvedCommand =
      this.commands.get(commandName) ||
      this.commands.get(this.aliases.get(commandName) || "");

    if (!resolvedCommand) {
      return;
    }

    // Check cooldown
    if (this.rateLimiter.hasCooldown(message.author.id, commandName)) {
      const remaining = this.rateLimiter.getCooldownRemaining(
        message.author.id,
        commandName
      );
      await message.reply(
        `⏱️ Please wait ${remaining}s before using this command again.`
      );
      return;
    }

    // Check permissions
    if (resolvedCommand.adminOnly && !message.member?.permissions.has("Administrator")) {
      await message.reply("❌ You need administrator permissions to use this command.");
      return;
    }

    if (resolvedCommand.ownerOnly && message.author.id !== config.discord.ownerId) {
      await message.reply("❌ Only the bot owner can use this command.");
      return;
    }

    // Check required permissions
    if (resolvedCommand.requiredPermissions.length > 0) {
      const hasPermissions = await PermissionValidator.checkBotPermission(
        message.guild!,
        resolvedCommand.requiredPermissions[0]
      );

      if (!hasPermissions) {
        await message.reply(
          `❌ I don't have the required permissions to execute this command.`
        );
        return;
      }
    }

    try {
      await resolvedCommand.execute(message, args);
      this.rateLimiter.setCooldown(
        message.author.id,
        commandName,
        resolvedCommand.cooldown
      );
    } catch (error) {
      logger.error(`Command execution failed: ${commandName}`, { error });
      await message.reply(
        "❌ An error occurred while executing this command."
      ).catch(() => {});
    }
  }

  getCommand(name: string): PrefixCommand | undefined {
    return this.commands.get(name) || this.commands.get(this.aliases.get(name) || "");
  }

  getAllCommands(): PrefixCommand[] {
    return Array.from(this.commands.values());
  }

  getCommandsByCategory(category: string): PrefixCommand[] {
    return this.getAllCommands().filter((cmd) => cmd.category === category);
  }
}

export const commandManager = new CommandManager();