import logger from "../logging/logger";
import prisma from "../database/prisma";
import { v4 as uuidv4 } from "uuid";

export class BackupService {
  async createBackup(guildId: string, creatorId?: string): Promise<any> {
    try {
      const guildData = await prisma.guild.findUnique({
        where: { id: guildId },
        include: {
          roles: true,
          channels: true,
          members: true,
        },
      });

      if (!guildData) return null;

      const data = JSON.stringify(guildData);
      const size = Buffer.byteLength(data);
      const name = `backup-${new Date().toISOString()}`;

      const backup = await prisma.backup.create({
        data: {
          id: uuidv4(),
          guildId,
          name,
          data,
          size,
          creatorId,
          isAutomatic: !creatorId,
        },
      });

      logger.info(`Backup created: ${name}`, { guildId, size });
      return backup;
    } catch (error) {
      logger.error("Failed to create backup", { error, guildId });
      return null;
    }
  }

  async getBackups(guildId: string): Promise<any[]> {
    try {
      return await prisma.backup.findMany({
        where: { guildId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error("Failed to get backups", { error, guildId });
      return [];
    }
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      await prisma.backup.delete({
        where: { id: backupId },
      });
      logger.info(`Backup deleted: ${backupId}`);
      return true;
    } catch (error) {
      logger.error("Failed to delete backup", { error, backupId });
      return false;
    }
  }
}

export const backupService = new BackupService();