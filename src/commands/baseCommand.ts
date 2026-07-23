import { Message, Guild, User } from "discord.js";
import logger from "../logging/logger";

export abstract class BaseCommand {
  public name: string = "";
  public description: string = "";
  public category: string = "";
  public cooldown: number = 3;
  public requiredPermissions: bigint[] = [];
  public adminOnly: boolean = false;
  public ownerOnly: boolean = false;

  abstract execute(
    message: Message,
    args: string[]
  ): Promise<void>;

  protected logExecution(
    message: Message,
    args: string[]
  ): void {
    logger.info(`Command executed: ${this.name}`, {
      userId: message.author.id,
      guildId: message.guild?.id,
      args: args.join(" "),
    });
  }
}

export interface PrefixCommand {
  name: string;
  description: string;
  category: string;
  aliases: string[];
  cooldown: number;
  requiredPermissions: bigint[];
  adminOnly: boolean;
  ownerOnly: boolean;
  execute: (message: Message, args: string[]) => Promise<void>;
}

export interface SlashCommand {
  name: string;
  description: string;
  category: string;
  options?: any[];
  execute: (interaction: any) => Promise<void>;
}
