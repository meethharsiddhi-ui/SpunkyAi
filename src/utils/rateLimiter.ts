import { RateLimitData } from "./types";

interface RateLimitStore {
  [key: string]: RateLimitData[];
}

export class RateLimiter {
  private store: RateLimitStore = {};
  private cooldowns: Map<string, Map<string, number>> = new Map();

  checkRateLimit(
    userId: string,
    command: string,
    limit: number = 5,
    windowMs: number = 60000
  ): boolean {
    const key = `${userId}:${command}`;
    const now = Date.now();

    if (!this.store[key]) {
      this.store[key] = [];
    }

    // Remove old entries
    this.store[key] = this.store[key].filter((entry) => now - entry.timestamp < windowMs);

    if (this.store[key].length >= limit) {
      return false;
    }

    this.store[key].push({
      userId,
      command,
      timestamp: now,
      uses: this.store[key].length + 1,
    });

    return true;
  }

  setCooldown(userId: string, command: string, seconds: number): void {
    if (!this.cooldowns.has(userId)) {
      this.cooldowns.set(userId, new Map());
    }

    this.cooldowns.get(userId)!.set(command, Date.now() + seconds * 1000);
  }

  hasCooldown(userId: string, command: string): boolean {
    const userCooldowns = this.cooldowns.get(userId);
    if (!userCooldowns) return false;

    const cooldownTime = userCooldowns.get(command);
    if (!cooldownTime) return false;

    if (Date.now() >= cooldownTime) {
      userCooldowns.delete(command);
      return false;
    }

    return true;
  }

  getCooldownRemaining(userId: string, command: string): number {
    const userCooldowns = this.cooldowns.get(userId);
    if (!userCooldowns) return 0;

    const cooldownTime = userCooldowns.get(command);
    if (!cooldownTime) return 0;

    const remaining = Math.ceil((cooldownTime - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  clearCooldown(userId: string, command: string): void {
    const userCooldowns = this.cooldowns.get(userId);
    if (userCooldowns) {
      userCooldowns.delete(command);
    }
  }
}
