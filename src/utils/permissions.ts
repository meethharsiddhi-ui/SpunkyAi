import config from "../config/config";
import { Guild, GuildMember, PermissionFlagsBits, PermissionsBitField } from "discord.js";

export class PermissionValidator {
  static async checkMemberPermission(
    member: GuildMember,
    permission: bigint
  ): Promise<boolean> {
    return member.permissions.has(permission);
  }

  static async checkBotPermission(guild: Guild, permission: bigint): Promise<boolean> {
    const botMember = await guild.members.fetchMe();
    return botMember.permissions.has(permission);
  }

  static async canModerate(member: GuildMember, target: GuildMember): Promise<boolean> {
    if (target.user.id === config.discord.ownerId) return false;
    if (member.roles.highest.position <= target.roles.highest.position) return false;
    return true;
  }

  static async canDelete(guild: Guild): Promise<boolean> {
    const botMember = await guild.members.fetchMe();
    return botMember.permissions.has(PermissionFlagsBits.ManageChannels);
  }

  static getRequiredPermissionsText(permissions: bigint[]): string {
    const permNames = permissions.map((p) => {
      const pf = new PermissionsBitField(p);
      return pf.toArray().join(", ");
    });
    return permNames.join("; ");
  }
}
