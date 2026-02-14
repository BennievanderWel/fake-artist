import { promises as fs } from "fs";
import { join } from "path";
import type { Room } from "../types/game";

const STORAGE_PATH = join(process.cwd(), "data", "game-state.json");

interface StorageData {
  rooms: Record<string, Room>;
  lastCleanup: number;
}

async function ensureStorageExists(): Promise<void> {
  try {
    await fs.access(STORAGE_PATH);
  } catch {
    // Create directory and file if they don't exist
    await fs.mkdir(join(process.cwd(), "data"), { recursive: true });
    await fs.writeFile(
      STORAGE_PATH,
      JSON.stringify({ rooms: {}, lastCleanup: Date.now() }),
    );
  }
}

export async function readStorage(): Promise<StorageData> {
  await ensureStorageExists();
  const data = await fs.readFile(STORAGE_PATH, "utf-8");
  return JSON.parse(data);
}

export async function writeStorage(data: StorageData): Promise<void> {
  await ensureStorageExists();
  await fs.writeFile(STORAGE_PATH, JSON.stringify(data, null, 2));
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const storage = await readStorage();
  return storage.rooms[roomId] || null;
}

export async function updateRoom(roomId: string, room: Room): Promise<void> {
  const storage = await readStorage();
  storage.rooms[roomId] = room;
  await writeStorage(storage);
}

export async function deleteRoom(roomId: string): Promise<void> {
  const storage = await readStorage();
  delete storage.rooms[roomId];
  await writeStorage(storage);
}

export async function getAllRooms(): Promise<Record<string, Room>> {
  const storage = await readStorage();
  return storage.rooms;
}

export async function cleanupStaleRooms(): Promise<void> {
  const storage = await readStorage();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  // Only cleanup if last cleanup was more than 1 hour ago
  if (now - storage.lastCleanup < oneHour) {
    return;
  }

  const activeRooms: Record<string, Room> = {};
  Object.entries(storage.rooms).forEach(([id, room]) => {
    if (now - room.lastActivity < oneHour) {
      activeRooms[id] = room;
    }
  });

  storage.rooms = activeRooms;
  storage.lastCleanup = now;
  await writeStorage(storage);
}
