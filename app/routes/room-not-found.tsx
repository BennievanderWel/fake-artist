import { useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/room-not-found";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Fake Artist - Room Not Found" }];
}

export default function RoomNotFound() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("id");

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-700">
        <div className="mb-6">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-3xl font-bold text-white mb-2">Room Not Found</h1>
          <p className="text-gray-300">
            {roomId ? (
              <>
                Room{" "}
                <span className="font-mono font-bold text-pink-400">
                  {roomId}
                </span>{" "}
                doesn't exist or has been closed.
              </>
            ) : (
              "The room you're looking for doesn't exist."
            )}
          </p>
        </div>

        <button
          onClick={() => navigate("/lobby")}
          className="w-full bg-linear-to-r from-pink-600 to-pink-700 text-white font-semibold py-3 rounded-lg hover:from-pink-700 hover:to-pink-800 transition transform hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/30"
        >
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
