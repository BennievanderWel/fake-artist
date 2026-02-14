export interface Player {
  id: string;
  name: string;
  isReady: boolean;
}

export interface Room {
  id: string;
  ownerId: string;
  players: Player[];
  currentWord: string | null;
  fakeArtistId: string | null;
  gameState: "waiting" | "playing";
  lastActivity: number;
}

export interface GameState {
  playerName: string | null;
  playerId: string | null;
  currentRoomId: string | null;
  rooms: Record<string, Room>;
}
