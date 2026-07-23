import { Client, GatewayIntentBits, Events, ChannelType } from "discord.js";
import logger from "../logging/logger";
import { commandManager } from "../commands/commandManager";
import { setupMessageEvents } from "../events/messageEvents";
import {
  pingCommand,
  helpCommand,
  askCommand,
  clearCommand,
  prefixCommand,
} from "../commands/defaultCommands";
import {
  warnCommand,
  banCommand,
  kickCommand,
  lockCommand,
  unlockCommand,
  purgeCommand,
  warningsCommand,
} from "../moderation/modCommands";
import config from "../config/config";
import { GuildService } from "../database/guildService";
import prisma from "../database/prisma";

export class DiscordBot {
  public client: Client;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
      ],
    });
  }

  async start(): Promise<void> {
    try {
      // Register default commands
      commandManager.register(pingCommand);
      commandManager.register(helpCommand);
      commandManager.register(askCommand);
      commandManager.register(clearCommand);
      commandManager.register(prefixCommand);

      // Register moderation commands
      commandManager.register(warnCommand);
      commandManager.register(banCommand);
      commandManager.register(kickCommand);
      commandManager.register(lockCommand);
      commandManager.register(unlockCommand);
      commandManager.register(purgeCommand);
      commandManager.register(warningsCommand);

      // Setup event handlers
      this.setupEvents();
      await setupMessageEvents(this.client);

      // Login
      await this.client.login(config.discord.token);
      logger.info("✅ Discord bot started successfully");
    } catch (error) {
      logger.error("Failed to start bot", { error });
      throw error;
    }
  }

  private setupEvents(): void {
    this.client.on(Events.ClientReady, async () => {
      logger.info(`✅ Bot logged in as ${this.client.user?.tag}`);
      await this.client.user?.setActivity("?help for commands", { type: "LISTENING" });
    });

    this.client.on(Events.GuildCreate, async (guild) => {
      logger.info(`Bot joined guild: ${guild.name}`);
      await GuildService.getOrCreateGuild(guild);
    });

    this.client.on(Events.GuildDelete, async (guild) => {
      logger.info(`Bot left guild: ${guild.name}`);
    });

    this.client.on(Events.Error, (error) => {
      logger.error("Discord.js error", { error });
    });
  }
}

export const bot = new DiscordBot();