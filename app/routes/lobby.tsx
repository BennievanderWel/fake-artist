import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/lobby";
import { useGameStore } from "../store/gameStore";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Fake Artist - Lobby" },
    { name: "description", content: "Create or join a room" },
  ];
}

export default function Lobby() {
  const navigate = useNavigate();
  const { playerName, createRoom, joinRoom } = useGameStore();
  const [roomIdInput, setRoomIdInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // If no player name, redirect to home
    if (!playerName) {
      navigate("/");
    }
  }, [playerName, navigate]);

  const handleCreateRoom = async () => {
    const roomId = await createRoom();
    if (roomId) {
      navigate(`/room/${roomId}`);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (roomIdInput.length !== 5) {
      setError("Room ID must be 5 digits");
      return;
    }

    const success = await joinRoom(roomIdInput);
    if (success) {
      navigate(`/room/${roomIdInput}`);
    } else {
      navigate(`/room-not-found?id=${roomIdInput}`);
    }
  };

  if (!playerName) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {playerName}! 👋
          </h1>
          <p className="text-gray-300">
            Create a new room or join an existing one
          </p>
        </div>

        <div className="space-y-6">
          {/* Create Room */}
          <div>
            <button
              onClick={handleCreateRoom}
              className="w-full bg-linear-to-r from-pink-600 to-pink-700 text-white font-semibold py-4 rounded-lg hover:from-pink-700 hover:to-pink-800 transition transform hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/30"
            >
              🎨 Create New Room
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-800 text-gray-400">OR</span>
            </div>
          </div>

          {/* Join Room */}
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label
                htmlFor="roomId"
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                Room ID
              </label>
              <input
                id="roomId"
                type="text"
                value={roomIdInput}
                onChange={(e) => {
                  setRoomIdInput(e.target.value.replace(/\D/g, "").slice(0, 5));
                  setError("");
                }}
                placeholder="12345"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition text-center text-2xl tracking-wider font-mono text-white placeholder-gray-500"
                maxLength={5}
                required
              />
              {error && <p className="mt-2 text-sm text-pink-400">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105 active:scale-95"
            >
              🚪 Join Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
