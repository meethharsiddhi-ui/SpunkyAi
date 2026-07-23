import "dotenv/config";

const config = {
  discord: {
    token: process.env.DISCORD_TOKEN || "",
    prefix: process.env.BOT_PREFIX || "?",
    ownerId: process.env.BOT_OWNER_ID || "",
    devGuildId: process.env.DEV_GUILD_ID || "",
  },
  ai: {
    provider: (process.env.AI_PROVIDER || "openai") as "openai" | "gemini",
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "2048"),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7"),
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || "",
    },
  },
  server: {
    port: parseInt(process.env.PORT || "3000"),
    nodeEnv: (process.env.NODE_ENV || "development") as "development" | "production",
  },
  database: {
    url: process.env.DATABASE_URL || "file:./prisma/dev.db",
  },
  logging: {
    level: (process.env.LOG_LEVEL || "info") as
      | "error"
      | "warn"
      | "info"
      | "debug",
  },
};

export default config;