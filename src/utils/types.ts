import { Guild, User } from "discord.js";

export interface CommandContext {
  guild: Guild | null;
  user: User;
  timestamp: Date;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface AIInterpretationResult {
  intent: string;
  action: string;
  parameters: Record<string, unknown>;
  confidence: number;
  requiresConfirmation: boolean;
}

export interface ModActionPayload {
  action: "ban" | "kick" | "timeout" | "warn" | "mute" | "unmute" | "lock" | "unlock";
  targetId: string;
  moderatorId: string;
  reason?: string;
  duration?: number;
}

export interface GiveawayOptions {
  prize: string;
  duration: number;
  winnerCount: number;
  channelId: string;
  guildId: string;
}

export interface TicketOptions {
  type: string;
  reason?: string;
  guildId: string;
  userId: string;
  userName: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface RateLimitData {
  userId: string;
  command: string;
  timestamp: number;
  uses: number;
}
