import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("lobby", "routes/lobby.tsx"),
  route("room/:roomId", "routes/room.$roomId.tsx"),
  route("room-not-found", "routes/room-not-found.tsx"),
  route("api/rooms", "routes/api.rooms.tsx"),
  route("api/room/:roomId", "routes/api.room.$roomId.tsx"),
] satisfies RouteConfig;
