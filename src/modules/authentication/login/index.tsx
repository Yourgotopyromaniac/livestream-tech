// LoginUI.tsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconArrowLeft } from "@tabler/icons-react";

const LoginUI = () => {
  const [stage, setStage] = useState<"landing" | "username" | "join" | "host">(
    "landing"
  );
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  function handleHost() {
    const newRoomCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    navigate(`/stream/${newRoomCode}`, { state: { isHost: true, name } });
  }

  function handleJoin() {
    if (!roomCode) return;
    navigate(`/stream/${roomCode}`, { state: { isHost: false, name } });
  }

  return (
    <div className="flex flex-col items-start justify-center h-full gap-8 text-white lg:w-[70%] w-full">
      <div className="flex items-center gap-4">
        {stage !== "landing" && (
          <button
            onClick={() => setStage("landing")}
            className="border-2 cursor-pointer size-10 border-gray-200 rounded-full flex items-center justify-center"
          >
            <IconArrowLeft size={16} stroke="white" strokeWidth={2} />
          </button>
        )}
        <h1 className="font-semibold text-4xl">Livestream Demo</h1>
      </div>

      <div className="flex flex-col items-center w-full gap-4">
        {stage === "landing" && (
          <>
            <Button onClick={() => setStage("host")} className="w-full p-8">
              Host Stream
            </Button>
            <Button onClick={() => setStage("join")} className="w-full p-8">
              Join Stream
            </Button>
          </>
        )}

        {stage === "join" && (
          <>
            <Input
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="h-14"
            />
            <Input
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14"
            />
            <Button onClick={handleJoin} className="w-full p-8">
              Join
            </Button>
          </>
        )}

        {stage === "host" && (
          <>
            <Input
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14"
            />
            <Button onClick={handleHost} className="w-full p-8">
              Start stream
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export { LoginUI };
