import config from "../config/config";
import { aiInterpreter } from "./interpreter";
import { geminiInterpreter } from "./geminiInterpreter";
import logger from "../logging/logger";
import { AIInterpretationResult } from "../utils/types";
import prisma from "../database/prisma";
import { v4 as uuidv4 } from "uuid";

export class AIService {
  async processUserMessage(
    userMessage: string,
    guildId: string,
    userId: string,
    userName: string
  ): Promise<{ interpretation: AIInterpretationResult | null; response: string | null }> {
    try {
      let interpretation: AIInterpretationResult | null = null;
      let response: string | null = null;

      if (config.ai.provider === "openai") {
        interpretation = await aiInterpreter.interpretCommand(userMessage, guildId, userId);
        response = await aiInterpreter.generateResponse(userMessage, guildId, userId);
      } else if (config.ai.provider === "gemini") {
        interpretation = await geminiInterpreter.interpretCommand(userMessage, guildId, userId);
        response = await geminiInterpreter.generateResponse(userMessage, guildId, userId);
      }

      // Log conversation
      if (response) {
        try {
          await prisma.aIConversation.create({
            data: {
              id: uuidv4(),
              guildId,
              userId,
              messageId: uuidv4(),
              userMessage,
              botResponse: response,
              tokens: Math.ceil((userMessage.length + response.length) / 4),
              provider: config.ai.provider,
              model: config.ai.provider === "openai" ? config.ai.openai.model : "gemini-pro",
            },
          });
        } catch (dbError) {
          logger.error("Failed to log AI conversation", { dbError, guildId, userId });
        }
      }

      return { interpretation, response };
    } catch (error) {
      logger.error("Failed to process user message", { error, guildId, userId });
      return { interpretation: null, response: null };
    }
  }

  async getConversationHistory(
    guildId: string,
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      return await prisma.aIConversation.findMany({
        where: {
          guildId,
          userId,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    } catch (error) {
      logger.error("Failed to get conversation history", { error, guildId, userId });
      return [];
    }
  }

  clearHistory(guildId: string, userId: string): void {
    if (config.ai.provider === "openai") {
      aiInterpreter.clearHistory(guildId, userId);
    } else if (config.ai.provider === "gemini") {
      geminiInterpreter.clearHistory(guildId, userId);
    }
  }
}

export const aiService = new AIService();