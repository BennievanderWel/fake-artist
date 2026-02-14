import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/home";
import { useGameStore } from "../store/gameStore";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Fake Artist - Enter Your Name" },
    { name: "description", content: "Join the Fake Artist drawing game!" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const { playerName, setPlayerName } = useGameStore();
  const [name, setName] = useState("");

  useEffect(() => {
    // If player already has a name, go to lobby
    if (playerName) {
      navigate("/lobby");
    }
  }, [playerName, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setPlayerName(name.trim());
      navigate("/lobby");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎨 Fake Artist</h1>
          <p className="text-gray-300">Enter your name to start playing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition text-white placeholder-gray-400"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-linear-to-r from-pink-600 to-pink-700 text-white font-semibold py-3 rounded-lg hover:from-pink-700 hover:to-pink-800 transition transform hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/30"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
