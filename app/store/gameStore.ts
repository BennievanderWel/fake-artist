import { create } from "zustand";
import type { GameState, Room, Player } from "../types/game";
import {
  generateRoomId,
  generatePlayerId,
  getRandomWord,
} from "../utils/wordList";

interface GameStore extends GameState {
  // Player actions
  setPlayerName: (name: string) => void;

  // Room actions
  createRoom: () => Promise<string>;
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  toggleReady: () => Promise<void>;
  startGame: () => Promise<void>;
  restartGame: () => Promise<void>;

  // Utility
  syncRoom: (roomId: string) => Promise<void>;
  getCurrentRoom: () => Room | null;
}

// Helper functions for API calls
async function apiCall(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  return response.json();
}

export const useGameStore = create<GameStore>()((set, get) => ({
  playerName: null,
  playerId: null,
  currentRoomId: null,
  rooms: {},

  setPlayerName: (name: string) => {
    const playerId = generatePlayerId();
    set({ playerName: name, playerId });
    // Store in sessionStorage to persist across page refreshes
    if (typeof window !== "undefined") {
      sessionStorage.setItem("playerName", name);
      sessionStorage.setItem("playerId", playerId);
    }
  },

  createRoom: async () => {
    const { playerId, playerName, rooms } = get();
    if (!playerId || !playerName) return "";

    const roomId = generateRoomId();
    const newRoom: Room = {
      id: roomId,
      ownerId: playerId,
      players: [
        {
          id: playerId,
          name: playerName,
          isReady: false,
        },
      ],
      currentWord: null,
      fakeArtistId: null,
      gameState: "waiting",
      lastActivity: Date.now(),
    };

    // Save to server
    await apiCall(`/api/room/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", data: newRoom }),
    });

    set({
      rooms: { ...rooms, [roomId]: newRoom },
      currentRoomId: roomId,
    });

    return roomId;
  },

  joinRoom: async (roomId: string) => {
    const { playerId, playerName, rooms } = get();
    if (!playerId || !playerName) return false;

    try {
      // Fetch room from server
      const { room } = await apiCall(`/api/room/${roomId}`);
      if (!room) return false;

      // Check if player is already in the room
      const existingPlayer = room.players.find(
        (p: Player) => p.id === playerId,
      );
      if (existingPlayer) {
        set({
          rooms: { ...rooms, [roomId]: room },
          currentRoomId: roomId,
        });
        return true;
      }

      // Add player to room
      const updatedRoom: Room = {
        ...room,
        players: [
          ...room.players,
          { id: playerId, name: playerName, isReady: false },
        ],
        lastActivity: Date.now(),
      };

      // Update on server
      await apiCall(`/api/room/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", data: updatedRoom }),
      });

      set({
        rooms: { ...rooms, [roomId]: updatedRoom },
        currentRoomId: roomId,
      });

      return true;
    } catch (error) {
      console.error("Failed to join room:", error);
      return false;
    }
  },

  leaveRoom: async () => {
    const { playerId, currentRoomId, rooms } = get();
    if (!playerId || !currentRoomId) return;

    const room = rooms[currentRoomId];
    if (!room) return;

    const updatedPlayers = room.players.filter((p) => p.id !== playerId);

    // If no players left, delete the room
    if (updatedPlayers.length === 0) {
      await apiCall(`/api/room/${currentRoomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete" }),
      });
      const { [currentRoomId]: _, ...remainingRooms } = rooms;
      set({ rooms: remainingRooms, currentRoomId: null });
      return;
    }

    // If owner left, assign new owner
    const newOwnerId =
      room.ownerId === playerId ? updatedPlayers[0].id : room.ownerId;

    const updatedRoom: Room = {
      ...room,
      ownerId: newOwnerId,
      players: updatedPlayers,
      lastActivity: Date.now(),
    };

    await apiCall(`/api/room/${currentRoomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", data: updatedRoom }),
    });

    set({
      rooms: { ...rooms, [currentRoomId]: updatedRoom },
      currentRoomId: null,
    });
  },

  toggleReady: async () => {
    const { playerId, currentRoomId, rooms } = get();
    if (!playerId || !currentRoomId) return;

    const room = rooms[currentRoomId];
    if (!room) return;

    const updatedPlayers = room.players.map((p) =>
      p.id === playerId ? { ...p, isReady: !p.isReady } : p,
    );

    const updatedRoom: Room = {
      ...room,
      players: updatedPlayers,
      lastActivity: Date.now(),
    };

    await apiCall(`/api/room/${currentRoomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", data: updatedRoom }),
    });

    set({ rooms: { ...rooms, [currentRoomId]: updatedRoom } });
  },

  startGame: async () => {
    const { currentRoomId, rooms } = get();
    if (!currentRoomId) return;

    const room = rooms[currentRoomId];
    if (!room || room.players.length < 2) return;

    // Check if all players are ready
    const allReady = room.players.every((p) => p.isReady);
    if (!allReady) return;

    // Pick random word and fake artist
    const word = getRandomWord();
    const fakeArtistIndex = Math.floor(Math.random() * room.players.length);
    const fakeArtistId = room.players[fakeArtistIndex].id;

    const updatedRoom: Room = {
      ...room,
      currentWord: word,
      fakeArtistId,
      gameState: "playing",
      lastActivity: Date.now(),
    };

    await apiCall(`/api/room/${currentRoomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", data: updatedRoom }),
    });

    set({ rooms: { ...rooms, [currentRoomId]: updatedRoom } });
  },

  restartGame: async () => {
    const { playerId, currentRoomId, rooms } = get();
    if (!playerId || !currentRoomId) return;

    const room = rooms[currentRoomId];
    if (!room || room.ownerId !== playerId) return;

    const updatedRoom: Room = {
      ...room,
      currentWord: null,
      fakeArtistId: null,
      gameState: "waiting",
      players: room.players.map((p) => ({ ...p, isReady: false })),
      lastActivity: Date.now(),
    };

    await apiCall(`/api/room/${currentRoomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", data: updatedRoom }),
    });

    set({ rooms: { ...rooms, [currentRoomId]: updatedRoom } });
  },

  syncRoom: async (roomId: string) => {
    try {
      const { room } = await apiCall(`/api/room/${roomId}`);
      if (room) {
        const { rooms } = get();
        set({ rooms: { ...rooms, [roomId]: room } });
      }
    } catch (error) {
      console.error("Failed to sync room:", error);
    }
  },

  getCurrentRoom: () => {
    const { currentRoomId, rooms } = get();
    if (!currentRoomId) return null;
    return rooms[currentRoomId] || null;
  },
}));

// Initialize player data from sessionStorage on client
if (typeof window !== "undefined") {
  const playerName = sessionStorage.getItem("playerName");
  const playerId = sessionStorage.getItem("playerId");
  if (playerName && playerId) {
    useGameStore.setState({ playerName, playerId });
  }
}
