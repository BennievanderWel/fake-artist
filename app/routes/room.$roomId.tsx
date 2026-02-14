import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { Route } from "./+types/room.$roomId";
import { useGameStore } from "../store/gameStore";
import type { Player } from "../types/game";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Fake Artist - Game Room" }];
}

export default function Room() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const {
    playerName,
    playerId,
    currentRoomId,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
    restartGame,
    syncRoom,
    getCurrentRoom,
  } = useGameStore();

  const [copied, setCopied] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const room = getCurrentRoom();

  // Polling interval - check for updates every 2 seconds
  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(() => {
      syncRoom(roomId);
    }, 2000);

    return () => clearInterval(interval);
  }, [roomId, syncRoom]);

  // Initial room check
  useEffect(() => {
    if (!playerName) {
      navigate("/");
      return;
    }

    if (!roomId) {
      navigate("/lobby");
      return;
    }

    // If not in this room, try to join
    if (currentRoomId !== roomId) {
      const success = joinRoom(roomId);
      if (!success) {
        navigate(`/room-not-found?id=${roomId}`);
      }
    }
  }, [roomId, playerName, currentRoomId, joinRoom, navigate]);

  // Check if room still exists
  useEffect(() => {
    if (roomId && currentRoomId === roomId && !room) {
      navigate(`/room-not-found?id=${roomId}`);
    }
  }, [room, roomId, currentRoomId, navigate]);

  const handleLeave = async () => {
    await leaveRoom();
    navigate("/lobby");
  };

  const handleCopyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = async () => {
    if (room && room.players.length >= 2) {
      const allReady = room.players.every((p: Player) => p.isReady);
      if (allReady) {
        await startGame();
      }
    }
  };

  if (!room || !playerId) return null;

  const currentPlayer = room.players.find((p: Player) => p.id === playerId);
  const isOwner = room.ownerId === playerId;
  const isFakeArtist = room.fakeArtistId === playerId;
  const allReady = room.players.every((p: Player) => p.isReady);
  const canStart =
    isOwner &&
    allReady &&
    room.players.length >= 2 &&
    room.gameState === "waiting";

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Room {roomId}</h1>
              <p className="text-sm text-gray-300">
                {isOwner && "👑 "}You: {currentPlayer?.name}
              </p>
            </div>
            <button
              onClick={handleCopyRoomId}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition text-white"
            >
              {copied ? "✓ Copied!" : "📋 Copy Room ID"}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleLeave}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium transition"
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Game State */}
        {room.gameState === "playing" ? (
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 mb-6 border border-gray-700">
            <div className="text-center">
              {isRevealing ? (
                <>
                  {isFakeArtist ? (
                    <>
                      <div className="text-6xl mb-4">🎭</div>
                      <h2 className="text-3xl font-bold text-pink-400 mb-2">
                        You are the Fake Artist!
                      </h2>
                      <p className="text-gray-300">
                        Pretend you know what everyone else is drawing!
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl mb-4">🎨</div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        The word is:
                      </h2>
                      <div className="text-5xl font-bold text-pink-400 mb-4">
                        {room.currentWord}
                      </div>
                      <p className="text-gray-300">
                        Draw this word, but watch out for the fake artist!
                      </p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">👀</div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Hold to reveal your {isFakeArtist ? "role" : "word"}
                  </h2>
                  <button
                    onMouseDown={() => setIsRevealing(true)}
                    onMouseUp={() => setIsRevealing(false)}
                    onMouseLeave={() => setIsRevealing(false)}
                    onTouchStart={() => setIsRevealing(true)}
                    onTouchEnd={() => setIsRevealing(false)}
                    onContextMenu={(e) => e.preventDefault()}
                    className="px-12 py-6 bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white font-bold text-lg rounded-xl transition shadow-lg shadow-pink-500/30 select-none cursor-pointer"
                  >
                    Press & Hold
                  </button>
                  <p className="text-gray-400 text-sm mt-4">
                    Keep it private from other players!
                  </p>
                </>
              )}
            </div>

            {isOwner && (
              <div className="mt-8 pt-6 border-t border-gray-700">
                <button
                  onClick={restartGame}
                  className="w-full bg-linear-to-r from-pink-600 to-pink-700 text-white font-semibold py-3 rounded-lg hover:from-pink-700 hover:to-pink-800 transition transform hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/30"
                >
                  🔄 Restart Game
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 mb-6 border border-gray-700">
            <div className="text-center">
              <div className="text-5xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Waiting for players...
              </h2>
              <p className="text-gray-300 mb-6">
                All players must mark themselves as ready to start the game.
                <br />
                <span className="text-sm">(Minimum 2 players required)</span>
              </p>

              <button
                onClick={toggleReady}
                className={`px-8 py-3 rounded-lg font-semibold transition transform hover:scale-105 active:scale-95 ${
                  currentPlayer?.isReady
                    ? "bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-500/30"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}
              >
                {currentPlayer?.isReady ? "✓ Ready" : "Not Ready"}
              </button>

              {canStart && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={handleStartGame}
                    className="w-full bg-linear-to-r from-pink-600 to-pink-700 text-white font-semibold py-4 rounded-lg hover:from-pink-700 hover:to-pink-800 transition transform hover:scale-105 active:scale-95 text-lg shadow-lg shadow-pink-500/30"
                  >
                    🚀 Start Game
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Players List */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">
            Players ({room.players.length})
          </h3>
          <div className="space-y-3">
            {room.players.map((player: Player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-lg transition ${
                  player.id === playerId
                    ? "bg-gray-700 border-2 border-pink-500"
                    : "bg-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {player.id === room.ownerId ? "👑" : "👤"}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {player.name}
                      {player.id === playerId && " (You)"}
                    </p>
                    {player.id === room.ownerId && (
                      <p className="text-xs text-gray-400">Room Owner</p>
                    )}
                  </div>
                </div>
                <div>
                  {room.gameState === "waiting" && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        player.isReady
                          ? "bg-pink-600 text-white"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {player.isReady ? "✓ Ready" : "Not Ready"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
