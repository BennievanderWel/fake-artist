import type { Route } from "./+types/api.rooms";
import { getAllRooms, cleanupStaleRooms } from "../lib/storage.server";

// GET /api/rooms - Get all rooms
export async function loader({}: Route.LoaderArgs) {
  // Run cleanup on every request
  await cleanupStaleRooms();

  const rooms = await getAllRooms();
  return Response.json({ rooms });
}
