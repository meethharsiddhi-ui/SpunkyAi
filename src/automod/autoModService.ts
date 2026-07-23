import logger from "../logging/logger";
import prisma from "../database/prisma";
import { v4 as uuidv4 } from "uuid";

export class AutoModService {
  async createRule(
    guildId: string,
    name: string,
    pattern: string,
    actionType: string
  ): Promise<any> {
    try {
      return await prisma.autoModRule.create({
        data: {
          id: uuidv4(),
          guildId,
          name,
          pattern,
          actionType,
          enabled: true,
        },
      });
    } catch (error) {
      logger.error("Failed to create automod rule", { error, guildId });
      return null;
    }
  }

  async checkMessage(guildId: string, content: string): Promise<any> {
    try {
      const rules = await prisma.autoModRule.findMany({
        where: {
          guildId,
          enabled: true,
        },
      });

      for (const rule of rules) {
        try {
          const regex = new RegExp(rule.pattern, "gi");
          if (regex.test(content)) {
            return rule;
          }
        } catch (e) {
          logger.warn(`Invalid regex in rule: ${rule.id}`);
        }
      }

      return null;
    } catch (error) {
      logger.error("Failed to check message", { error, guildId });
      return null;
    }
  }

  async getRules(guildId: string): Promise<any[]> {
    try {
      return await prisma.autoModRule.findMany({
        where: { guildId },
      });
    } catch (error) {
      logger.error("Failed to get automod rules", { error, guildId });
      return [];
    }
  }

  async disableRule(ruleId: string): Promise<boolean> {
    try {
      await prisma.autoModRule.update({
        where: { id: ruleId },
        data: { enabled: false },
      });
      return true;
    } catch (error) {
      logger.error("Failed to disable rule", { error, ruleId });
      return false;
    }
  }
}

export const autoModService = new AutoModService();