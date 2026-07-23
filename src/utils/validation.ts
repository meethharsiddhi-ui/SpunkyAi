import logger from "../logging/logger";

export class ValidationUtils {
  static validateDiscordId(id: string): boolean {
    return /^\d{17,19}$/.test(id);
  }

  static validateHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  static parseColor(colorStr: string): string | null {
    // Handle common color names
    const colors: Record<string, string> = {
      red: "#FF0000",
      blue: "#0000FF",
      green: "#00FF00",
      black: "#000000",
      white: "#FFFFFF",
      yellow: "#FFFF00",
      purple: "#800080",
      orange: "#FFA500",
      pink: "#FFC0CB",
      gray: "#808080",
      grey: "#808080",
    };

    const lower = colorStr.toLowerCase();
    if (colors[lower]) {
      return colors[lower];
    }

    if (this.validateHexColor(colorStr)) {
      return colorStr;
    }

    return null;
  }

  static parseTime(timeStr: string): number | null {
    const regex = /(\d+)\s*(s|m|h|d)?/i;
    const match = timeStr.match(regex);

    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = (match[2] || "s").toLowerCase();

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] || 1000);
  }

  static extractMention(mention: string): string | null {
    const match = mention.match(/<@!?(\d+)>/);return match ? match[1] : null;
  }

  static extractChannelMention(mention: string): string | null {
    const match = mention.match(/<#(\d+)>/);return match ? match[1] : null;
  }

  static extractRoleMention(mention: string): string | null {
    const match = mention.match(/<@&(\d+)>/);return match ? match[1] : null;
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/```/g, "")
      .replace(/`/g, "")
      .substring(0, 1024);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static containsSuspiciousPatterns(text: string): boolean {
    const patterns = [
      /eval\s*\(/gi,
      /exec\s*\(/gi,
      /require\s*\(/gi,
      /import\s+/gi,
      /system\s*\(/gi,
    ];

    return patterns.some((pattern) => pattern.test(text));
  }
}
