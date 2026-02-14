import type { Route } from "./+types/api.room.$roomId";
import { getRoom, updateRoom, deleteRoom } from "../lib/storage.server";
import type { Room } from "../types/game";

// GET /api/room/:roomId - Get specific room
export async function loader({ params }: Route.LoaderArgs) {
  const room = await getRoom(params.roomId);
  if (!room) {
    return Response.json({ error: "Room not found" }, { status: 404 });
  }
  return Response.json({ room });
}

// POST /api/room/:roomId - Update room
export async function action({ params, request }: Route.ActionArgs) {
  const { roomId } = params;
  const body = await request.json();
  const { action: actionType, data } = body;

  const room = await getRoom(roomId);

  switch (actionType) {
    case "create": {
      const newRoom: Room = data;
      await updateRoom(roomId, newRoom);
      return Response.json({ success: true, room: newRoom });
    }

    case "update": {
      if (!room) {
        return Response.json({ error: "Room not found" }, { status: 404 });
      }
      const updatedRoom: Room = { ...room, ...data, lastActivity: Date.now() };
      await updateRoom(roomId, updatedRoom);
      return Response.json({ success: true, room: updatedRoom });
    }

    case "delete": {
      await deleteRoom(roomId);
      return Response.json({ success: true });
    }

    default:
      return Response.json({ error: "Invalid action" }, { status: 400 });
  }
}
