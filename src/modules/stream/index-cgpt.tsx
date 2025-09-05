import { ChatInput } from "@/components/chatInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { generateTestToken, getAvatarBgColor } from "@/lib";
import {
  IconCopy,
  IconLogout,
  IconMicrophoneFilled,
  IconMicrophoneOff,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerStopFilled,
  IconUserFilled,
} from "@tabler/icons-react";
import {
  RemoteTrack,
  RemoteVideoTrack,
  RemoteAudioTrack,
  LocalVideoTrack,
  LocalParticipant,
  Room,
  RoomEvent,
} from "livekit-client";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

interface Viewer {
  id: number;
  name: string;
}

interface ChatMessage {
  author: Viewer;
  text: string;
  sentAt: string;
}

interface StreamUIProps {}

const StreamUI: React.FC<StreamUIProps> = ({}) => {
  const [streamPaused, setStreamPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const viewers: Viewer[] = [
    { id: 1, name: "Biola" },
    {
      id: 2,
      name: "David",
    },
    {
      id: 3,
      name: "Xavier",
    },
  ];
  const chats: ChatMessage[] = [
    {
      author: { id: 1, name: "Biola" },
      text: "When do we start",
      sentAt: "9:36PM",
    },
    {
      author: { id: 2, name: "David" },
      text: "No way",
      sentAt: "9:37PM",
    },
    {
      author: { id: 2, name: "David" },
      text: "Did anyone see that?",
      sentAt: "9:38PM",
    },
    {
      author: { id: 3, name: "Xavier" },
      text: "Hi guys",
      sentAt: "9:40PM",
    },
    {
      author: { id: 3, name: "Xavier" },
      text: "Hi guys",
      sentAt: "9:40PM",
    },
    {
      author: { id: 3, name: "Xavier" },
      text: "Hi guys",
      sentAt: "9:40PM",
    },
    {
      author: { id: 3, name: "Xavier" },
      text: "Hi guys",
      sentAt: "9:40PM",
    },
    {
      author: { id: 3, name: "Xavier" },
      text: "Hi guys",
      sentAt: "9:40PM",
    },
    {
      author: { id: 3, name: "Xavier" },
      text: "Hi guys",
      sentAt: "9:40PM",
    },
    {
      author: { id: 3, name: "Xavier" },
      text: "Hi guys",
      sentAt: "9:40PM",
    },
    {
      author: { id: 3, name: "Xavier" },
      text: "Hi guys",
      sentAt: "9:40PM",
    },
  ];

  const { id: roomCode } = useParams<{ id: string }>();
  const location = useLocation();
  const { isHost, name } = location.state || {};
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [room, setRoom] = useState<Room | null>(null);
  useEffect(() => {
    let lkRoom: Room | null = null;

    function attachLocalPreview(p: LocalParticipant) {
      for (const pub of p.trackPublications.values()) {
        const track = pub.track;
        if (track?.kind === "video" && videoRef.current) {
          (track as LocalVideoTrack).attach(videoRef.current);
        }
      }
    }

    const onTrackSubscribed = (track: RemoteTrack) => {
      if (track.kind === "video" && videoRef.current) {
        (track as RemoteVideoTrack).attach(videoRef.current);
      } else if (track.kind === "audio" && audioRef.current) {
        (track as RemoteAudioTrack).attach(audioRef.current);
      }
    };

    const onTrackUnsubscribed = (track: RemoteTrack) => {
      if (track.kind === "video" && videoRef.current) {
        track.detach(videoRef.current);
      } else if (track.kind === "audio" && audioRef.current) {
        track.detach(audioRef.current);
      }
    };

    function detachAll() {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    }

    async function join() {
      const token = generateTestToken(
        import.meta.env.VITE_LIVEKIT_API_KEY,
        import.meta.env.VITE_LIVEKIT_API_SECRET,
        roomCode!,
        crypto.randomUUID(),
        name || "Guest",
        isHost
      );

      lkRoom = new Room();
      await lkRoom.connect(import.meta.env.VITE_LIVEKIT_URL, await token);
      setRoom(lkRoom);

      // Subscribe handlers BEFORE publishing/attaching to catch early events
      lkRoom.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
      lkRoom.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);

      if (isHost) {
        // Publish local tracks and attach local video preview
        await lkRoom.localParticipant.setCameraEnabled(true);
        await lkRoom.localParticipant.setMicrophoneEnabled(true);
        attachLocalPreview(lkRoom.localParticipant);
        // Do NOT attach local audio to audioRef to avoid echo/feedback
      }

      // (Optional) If you join after a publisher, render any already-available tracks:
      // for (const p of lkRoom.participants.values()) {
      //   for (const pub of p.tracks.values()) {
      //     const t = pub.track as RemoteTrack | null;
      //     if (!t) continue;
      //     onTrackSubscribed(t);
      //   }
      // }
    }

    join();

    return () => {
      if (lkRoom) {
        lkRoom.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
        lkRoom.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
        detachAll();
        lkRoom.disconnect();
      }
    };
  }, [roomCode, isHost, name]);

  const toggleMute = async () => {
    if (!room || !isHost) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    await room.localParticipant.setMicrophoneEnabled(!newMutedState);
  };

  return (
    <div className="bg-[#101010] w-screen h-screen p-6 py-0 gap-4 flex flex-col items-center justify-center">
      <div className="w-full flex items-center justify-end gap-4">
        <Button
          variant="outline"
          className="bg-transparent items-center gap-2 border border-gray-600 hover:bg-foreground"
        >
          <span children={roomCode} className="text-white" />
          <IconCopy color="white" size={20} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-transparent border border-gray-600 hover:bg-foreground"
        >
          <IconLogout color="white" size={20} />
        </Button>
      </div>
      <div className="w-full flex items-center justify-between h-[80%]">
        <div className="w-1/2 h-full overflow-hidden relative rounded-md flex items-center justify-center border border-gray-600">
          <div className="bg-red-500 text-white p-2 rounded-md absolute top-2.5 animate-pulse left-2 flex items-center gap-2">
            <div className="size-2 rounded-full bg-white" />
            <span className="text-lg">LIVE</span>
          </div>

          <div className="bg-red-500 text-white p-2 rounded-md absolute top-2.5 right-2 flex items-center gap-2">
            <IconUserFilled stroke="white" size={16} />
            <span className="text-lg">{viewers.length}</span>
          </div>
          {streamPaused ? (
            <div className="text-white text-2xl">
              {isHost
                ? "You paused the stream"
                : "Stream has been paused by the host"}
            </div>
          ) : (
            <>
              <video
                autoPlay
                playsInline
                muted={!!isHost}
                ref={videoRef}
                className="w-full h-full object-cover border border-red-500 rounded-md"
              />
              <audio
                autoPlay
                ref={audioRef}
                muted={!!isHost}
                className="hidden"
              />
            </>
          )}

          {isHost && (
            <div className="absolute p-2 bottom-4 left-1/2 -translate-x-1/2 rounded-md border border-neutral-600 bg-[#22222271] backdrop-blur-xl flex items-center gap-2 justify-center">
              <Button
                onClick={toggleMute}
                size="sm"
                variant="ghost"
                className="hover:bg-foreground"
              >
                {isMuted ? (
                  <IconMicrophoneOff color="white" fill="white" size={20} />
                ) : (
                  <IconMicrophoneFilled fill="white" size={20} />
                )}
              </Button>
              <Button size="sm" variant="ghost" className="hover:bg-foreground">
                <IconPlayerStopFilled fill="white" size={20} />
              </Button>
              <Button
                onClick={() => setStreamPaused(!streamPaused)}
                size="sm"
                variant="ghost"
                className="hover:bg-foreground"
              >
                {!streamPaused ? (
                  <IconPlayerPauseFilled fill="white" size={20} />
                ) : (
                  <IconPlayerPlayFilled fill="white" size={20} />
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="w-[48%] h-full rounded-md relative p-4 border border-gray-600 flex flex-col gap-4 items-start justify-start">
          <div className="w-full flex flex-col items-start gap-2 overflow-auto no-scrollbar">
            {chats.map((chat, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-neutral-200 w-full"
              >
                <div className="flex items-center gap-2 justify-start">
                  <Avatar className="w-[40px] h-[40px]">
                    <AvatarImage src={undefined} alt="profile picture" />

                    <AvatarFallback
                      className={`text-base text-white uppercase ${getAvatarBgColor(
                        chat.author.name
                      )}`}
                    >
                      {chat.author.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {chat.author.name}
                    </span>
                    <span className="text-xs font-normal">{chat.text}</span>
                  </div>
                </div>
                <span className="text-[10px] text-neutral-500">
                  {chat.sentAt}
                </span>
              </div>
            ))}
          </div>
          <div className="absolute w-[95%] left-1/2 -translate-x-1/2 bottom-2">
            <ChatInput />
          </div>
        </div>
      </div>
    </div>
  );
};

export { StreamUI };
