import axios from "axios";
import logger from "../logging/logger";

export interface MinecraftServerStatus {
  online: boolean;
  players: number;
  maxPlayers: number;
  motd: string;
  ping: number;
}

export class MinecraftService {
  async getJavaServerStatus(host: string, port: number = 25565): Promise<MinecraftServerStatus | null> {
    try {
      const response = await axios.get(
        `https://api.mcsrvstat.us/2/${host}:${port}`,
        { timeout: 5000 }
      );

      const data = response.data;
      return {
        online: data.online,
        players: data.players?.online || 0,
        maxPlayers: data.players?.max || 0,
        motd: data.motd?.clean?.[0] || "No MOTD",
        ping: data.ping || 0,
      };
    } catch (error) {
      logger.error("Failed to get Java server status", { error, host, port });
      return null;
    }
  }

  async getBedrockServerStatus(host: string, port: number = 19132): Promise<MinecraftServerStatus | null> {
    try {
      const response = await axios.get(
        `https://api.mcsrvstat.us/bedrock/2/${host}:${port}`,
        { timeout: 5000 }
      );

      const data = response.data;
      return {
        online: data.online,
        players: data.players?.online || 0,
        maxPlayers: data.players?.max || 0,
        motd: data.motd?.clean?.[0] || "No MOTD",
        ping: data.ping || 0,
      };
    } catch (error) {
      logger.error("Failed to get Bedrock server status", { error, host, port });
      return null;
    }
  }
}

export const minecraftService = new MinecraftService();