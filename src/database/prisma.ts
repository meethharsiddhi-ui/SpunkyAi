import { PrismaClient } from "@prisma/client";
import logger from "../logging/logger";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
      {
        emit: "event",
        level: "error",
      },
      {
        emit: "event",
        level: "warn",
      },
    ],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Event listeners for logging
prisma.$on("query", (e) => {
  logger.debug(`Query: ${e.query}`, { duration: `${e.duration}ms` });
});

prisma.$on("error", (e) => {
  logger.error(`Database Error: ${e.message}`);
});

prisma.$on("warn", (e) => {
  logger.warn(`Database Warning: ${e.message}`);
});

export default prisma;