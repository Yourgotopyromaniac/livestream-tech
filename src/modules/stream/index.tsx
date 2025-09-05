import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateTestToken, getAvatarBgColor } from "@/lib";
import {
  IconCopy,
  IconLogout,
  IconMicrophoneFilled,
  IconMicrophoneOff,
  IconPlayerStopFilled,
  IconUserFilled,
} from "@tabler/icons-react";
import {
  RemoteTrack,
  RemoteVideoTrack,
  RemoteAudioTrack,
  Room,
  RoomEvent,
  LocalVideoTrack,
  TrackPublication,
  RemoteParticipant,
} from "livekit-client";
import { ArrowUp, Bug, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  senderName: string;
  senderIdentity: string;
  message: string;
  timestamp: Date;
  isFromCurrentUser: boolean;
}

interface StreamUIProps {}

const StreamUI: React.FC<StreamUIProps> = ({}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const { id: roomCode } = useParams<{ id: string }>();
  const location = useLocation();
  const { isHost, name } = location.state || {};
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Store remote audio tracks for mute control
  const [_remoteAudioTracks, setRemoteAudioTracks] = useState<
    Set<RemoteAudioTrack>
  >(new Set());

  // Add debug log
  const addDebugLog = (message: string) => {
    if (debugMode) {
      const timestamp = new Date().toLocaleTimeString();
      setDebugLogs((prev) => [...prev, `${timestamp}: ${message}`].slice(-50)); // Keep last 50 logs
    }
  };

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    let lkRoom: Room | null = null;

    async function join() {
      try {
        const token = generateTestToken(
          import.meta.env.VITE_LIVEKIT_API_KEY,
          import.meta.env.VITE_LIVEKIT_API_SECRET,
          roomCode!,
          crypto.randomUUID(),
          name || "Guest",
          isHost
        );

        lkRoom = new Room();
        addDebugLog(`Creating new room instance: ${lkRoom.name}`);

        // Set up event handlers before connecting
        setupRoomHandlers(lkRoom);

        // Connect to room
        addDebugLog(`Connecting to room: ${roomCode}`);
        await lkRoom.connect(import.meta.env.VITE_LIVEKIT_URL, await token);
        setRoom(lkRoom);
        setIsConnected(true);
        addDebugLog(`Connected to room successfully`);

        // If host, enable camera and microphone
        if (isHost) {
          await lkRoom.localParticipant.setCameraEnabled(true);
          await lkRoom.localParticipant.setMicrophoneEnabled(true);
          addDebugLog(`Host camera and microphone enabled`);

          // Display local video for host
          displayLocalVideo(lkRoom);
        }
      } catch (error) {
        const errorMsg = `Failed to join room: ${error}`;
        console.error(errorMsg, error);
        addDebugLog(errorMsg);
        toast.error("Failed to join the stream");
      }
    }

    function setupRoomHandlers(room: Room) {
      addDebugLog("Setting up room event handlers");

      // Handle remote tracks (for viewers to see host's stream)
      room.on(
        RoomEvent.TrackSubscribed,
        (
          track: RemoteTrack,
          _publication: TrackPublication,
          participant: RemoteParticipant
        ) => {
          const logMsg = `Track subscribed: ${track.kind} from ${participant.identity}`;
          console.log(logMsg);
          addDebugLog(logMsg);

          if (track.kind === "video") {
            const videoTrack = track as RemoteVideoTrack;
            if (videoRef.current) {
              videoTrack.attach(videoRef.current);
              addDebugLog("Remote video attached");
            }
          } else if (track.kind === "audio") {
            const audioTrack = track as RemoteAudioTrack;
            if (audioRef.current) {
              audioTrack.attach(audioRef.current);
              addDebugLog("Remote audio attached");

              // Add to remote audio tracks for mute control
              setRemoteAudioTracks((prev) => new Set([...prev, audioTrack]));
            }
          }
        }
      );

      // Handle track unsubscribed
      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        track.detach();
        const logMsg = `Track unsubscribed: ${track.kind}`;
        console.log(logMsg);
        addDebugLog(logMsg);

        // Remove from remote audio tracks
        if (track.kind === "audio") {
          setRemoteAudioTracks((prev) => {
            const newSet = new Set(prev);
            newSet.delete(track as RemoteAudioTrack);
            return newSet;
          });
        }
      });

      // Handle track muted/unmuted events
      room.on(RoomEvent.TrackMuted, (publication, participant) => {
        const logMsg = `Track ${publication.kind} muted by ${participant.identity}`;
        console.log(logMsg);
        addDebugLog(logMsg);

        if (publication.kind === "audio" && audioRef.current) {
          audioRef.current.muted = true;
        }
      });

      room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
        const logMsg = `Track ${publication.kind} unmuted by ${participant.identity}`;
        console.log(logMsg);
        addDebugLog(logMsg);

        if (publication.kind === "audio" && audioRef.current) {
          audioRef.current.muted = false;
        }
      });

      // Handle local track published (for host)
      room.on(
        RoomEvent.LocalTrackPublished,
        (publication: TrackPublication) => {
          const logMsg = `Local track published: ${publication.kind}`;
          console.log(logMsg);
          addDebugLog(logMsg);

          if (isHost && publication.kind === "video") {
            displayLocalVideo(room);
          }
        }
      );

      // Handle participant connections
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        const logMsg = `Participant connected: ${participant.identity}`;
        console.log(logMsg);
        addDebugLog(logMsg);

        setParticipantCount(room.numParticipants);
        addDebugLog(`Participant count: ${room.numParticipants}`);

        // Subscribe to existing tracks
        participant.trackPublications.forEach((publication) => {
          if (publication.isSubscribed && publication.track) {
            if (publication.track.kind === "video" && videoRef.current) {
              (publication.track as RemoteVideoTrack).attach(videoRef.current);
            } else if (publication.track.kind === "audio" && audioRef.current) {
              const audioTrack = publication.track as RemoteAudioTrack;
              audioTrack.attach(audioRef.current);
              setRemoteAudioTracks((prev) => new Set([...prev, audioTrack]));
            }
          }
        });
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        const logMsg = `Participant disconnected: ${participant.identity}`;
        console.log(logMsg);
        addDebugLog(logMsg);

        setParticipantCount(room.numParticipants);
        addDebugLog(`Participant count: ${room.numParticipants}`);
      });

      // Handle room connection
      room.on(RoomEvent.Connected, () => {
        const logMsg = "Connected to room";
        console.log(logMsg);
        addDebugLog(logMsg);

        setParticipantCount(room.numParticipants);
        addDebugLog(`Participant count: ${room.numParticipants}`);
      });

      // Handle incoming chat messages - FIXED VERSION
      room.on(
        RoomEvent.DataReceived,
        (payload: Uint8Array, _participant?: RemoteParticipant) => {
          try {
            const decoder = new TextDecoder();
            const decoded = decoder.decode(payload);
            addDebugLog(`Raw data received: ${decoded}`);

            const messageData = JSON.parse(decoded);

            if (messageData.type === "chat") {
              // Check if this message is from the current user
              const isFromCurrentUser =
                messageData.senderIdentity === room.localParticipant.identity;

              const newChatMessage: ChatMessage = {
                id: messageData.id,
                senderName: messageData.senderName,
                senderIdentity: messageData.senderIdentity,
                message: messageData.message,
                timestamp: new Date(messageData.timestamp),
                isFromCurrentUser,
              };

              addDebugLog(
                `Received chat message from ${messageData.senderName} (${messageData.senderIdentity}): ${messageData.message}`
              );
              setChatMessages((prev) => [...prev, newChatMessage]);
            } else {
              addDebugLog(`Received non-chat data: ${decoded}`);
            }
          } catch (error) {
            const errorMsg = `Failed to parse incoming message: ${error}`;
            console.error(errorMsg, error);
            addDebugLog(errorMsg);
          }
        }
      );

      room.on(RoomEvent.Disconnected, () => {
        const logMsg = "Disconnected from room";
        console.log(logMsg);
        addDebugLog(logMsg);

        setIsConnected(false);
      });
    }

    function displayLocalVideo(room: Room) {
      const localVideoPublication = Array.from(
        room.localParticipant.videoTrackPublications.values()
      )[0];
      const localVideoTrack = localVideoPublication?.track as LocalVideoTrack;

      if (localVideoTrack && videoRef.current) {
        const currentSrcObject = videoRef.current.srcObject;
        if (currentSrcObject) {
          localVideoTrack.detach();
        }

        localVideoTrack.attach(videoRef.current);
        addDebugLog("Local video attached for host");
      }
    }

    join();

    // Cleanup function
    return () => {
      if (lkRoom) {
        addDebugLog("Cleaning up room connection");
        lkRoom.removeAllListeners();

        lkRoom.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((publication) => {
            if (publication.track) {
              publication.track.detach();
            }
          });
        });

        lkRoom.localParticipant.trackPublications.forEach((publication) => {
          if (publication.track) {
            publication.track.detach();
          }
        });

        lkRoom.disconnect();
      }
    };
  }, [roomCode, isHost, name]);

  // Send chat message function
  const sendChatMessage = async () => {
    if (!room || !newMessage.trim()) return;

    const messageId = crypto.randomUUID();
    const messageData = {
      type: "chat",
      id: messageId,
      senderName: name || "Guest",
      senderIdentity: room.localParticipant.identity,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add message to local state immediately (optimistic update)
    const localMessage: ChatMessage = {
      id: messageId,
      senderName: messageData.senderName,
      senderIdentity: messageData.senderIdentity,
      message: messageData.message,
      timestamp: new Date(messageData.timestamp),
      isFromCurrentUser: true,
    };

    try {
      setChatMessages((prev) => [...prev, localMessage]);
      addDebugLog(`Optimistically added message: ${newMessage.trim()}`);

      // Send message to other participants (including reliable delivery)
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(messageData));

      addDebugLog(`Publishing data to room: ${JSON.stringify(messageData)}`);
      await room.localParticipant.publishData(data, {
        reliable: true,
      });

      setNewMessage("");
      addDebugLog("Chat message sent successfully");
    } catch (error) {
      const errorMsg = `Failed to send chat message: ${error}`;
      console.error(errorMsg, error);
      addDebugLog(errorMsg);
      toast.error("Failed to send message");

      // Remove the optimistically added message on failure
      setChatMessages((prev) =>
        prev.filter((msg) => msg.id !== localMessage.id)
      );
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const toggleMute = async () => {
    if (!room || !isHost) return;

    try {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);

      // Disable/enable microphone track
      await room.localParticipant.setMicrophoneEnabled(!newMutedState);

      // Also control local audio playback if needed
      if (audioRef.current) {
        audioRef.current.muted = newMutedState;
      }

      const logMsg = `Host ${newMutedState ? "muted" : "unmuted"} microphone`;
      console.log(logMsg);
      addDebugLog(logMsg);
    } catch (error) {
      const errorMsg = `Failed to toggle mute: ${error}`;
      console.error(errorMsg, error);
      addDebugLog(errorMsg);
      // Revert state on error
      setIsMuted(!isMuted);
      toast.error("Failed to toggle mute");
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="bg-[#101010] w-screen h-screen p-6 py-0 gap-4 flex flex-col items-center justify-center">
      <div className="w-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          <span className="text-white text-sm">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="bg-transparent border border-gray-600 hover:bg-foreground"
            onClick={() => setDebugMode(!debugMode)}
          >
            <Bug className="h-4 w-4 text-white" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="bg-transparent items-center gap-2 border border-gray-600 hover:bg-foreground"
            onClick={() => {
              navigator.clipboard.writeText(roomCode || "");
              toast("Room code copied!");
            }}
          >
            <span children={roomCode} className="text-white" />
            <IconCopy color="white" size={20} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-transparent border border-gray-600 hover:bg-foreground"
            onClick={() => {
              if (room) {
                room.disconnect();
              }
              window.location.href = "/";
            }}
          >
            <IconLogout color="white" size={20} />
          </Button>
        </div>
      </div>

      <div className="w-full flex lg:flex-row flex-col items-center justify-between lg:h-[80%] h-[90%]">
        <div className="lg:w-1/2 w-full lg:h-full h-1/2 overflow-hidden relative rounded-md flex items-center justify-center border border-gray-600">
          <div className="bg-red-500 text-white p-2 rounded-md absolute top-2.5 animate-pulse left-2 flex items-center gap-2 z-10">
            <div className="size-2 rounded-full bg-white" />
            <span className="text-lg">LIVE</span>
          </div>

          <div className="bg-red-500 text-white p-2 rounded-md absolute top-2.5 right-2 flex items-center gap-2 z-10">
            <IconUserFilled stroke="white" size={16} />
            <span className="text-lg">{participantCount}</span>
          </div>

          {!isConnected ? (
            <div className="text-white text-2xl">Connecting...</div>
          ) : (
            <>
              <video
                autoPlay
                playsInline
                muted={isHost}
                ref={videoRef}
                className="w-full h-full object-cover rounded-md"
              />
              {!isHost && <audio autoPlay ref={audioRef} className="hidden" />}
            </>
          )}

          {isHost && (
            <div className="absolute p-2 bottom-4 left-1/2 -translate-x-1/2 rounded-md border border-neutral-600 bg-[#22222271] backdrop-blur-xl flex items-center gap-2 justify-center z-10">
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
              <Button
                size="sm"
                variant="ghost"
                className="hover:bg-foreground"
                onClick={() => {
                  if (room) {
                    room.disconnect();
                  }
                  window.location.href = "/";
                }}
              >
                <IconPlayerStopFilled fill="white" size={20} />
              </Button>
            </div>
          )}
        </div>

        <div className="lg:w-[48%] w-full lg:h-full h-[48%] rounded-md relative p-4 border border-gray-600 flex flex-col gap-4 items-start justify-start">
          {/* Chat Messages Container */}
          <div
            ref={chatContainerRef}
            className="w-full flex-1 flex flex-col items-start gap-3 overflow-auto no-scrollbar pb-16"
          >
            {chatMessages.length === 0 ? (
              <div className="text-neutral-500 text-center w-full mt-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              chatMessages.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex items-start justify-between text-neutral-200 w-full ${
                    chat.isFromCurrentUser ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`flex items-end gap-2 justify-start max-w-[80%] ${
                      chat.isFromCurrentUser ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className="w-[40px] h-[40px] flex-shrink-0">
                      <AvatarImage src={undefined} alt="profile picture" />
                      <AvatarFallback
                        className={`text-base text-white uppercase ${getAvatarBgColor(
                          chat.senderName
                        )}`}
                      >
                        {chat.senderName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex flex-col ${
                        chat.isFromCurrentUser ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 ${
                          chat.isFromCurrentUser ? "flex-row-reverse" : ""
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {chat.isFromCurrentUser ? "You" : chat.senderName}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {formatTimestamp(chat.timestamp)}
                        </span>
                      </div>
                      <div
                        className={`mt-1 px-3 py-2 bg-neutral-700 rounded-lg max-w-full break-words ${
                          chat.isFromCurrentUser
                            ? " text-white"
                            : " text-neutral-200"
                        }`}
                      >
                        <span className="text-sm">{chat.message}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat Input */}
          <div className="absolute w-[95%] left-1/2 -translate-x-1/2 bottom-2">
            <div className="flex gap-2 items-center">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleChatKeyPress}
                placeholder={"Send a message"}
                className="pr-14 h-12 border-gray-600 text-white bg-neutral-800 text-base placeholder:text-[#98A2B3] rounded-md focus:border-[#314CB6] focus:ring-2 focus:ring-[#314CB6]/20"
              />
              <Button
                onClick={sendChatMessage}
                disabled={!newMessage.trim()}
                className="absolute right-4 h-8 w-8 p-0 rounded-full bg-[#314CB6] hover:bg-[#314CB6]/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                size="sm"
              >
                <ArrowUp className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      {debugMode && (
        <div className="absolute bottom-4 left-4 w-1/3 h-1/3 bg-black bg-opacity-80 border border-gray-600 rounded-md p-4 overflow-auto">
          <div className="text-white font-bold mb-2">Debug Logs</div>
          <div className="text-gray-300 text-xs font-mono">
            {debugLogs.length === 0 ? (
              <div>No debug logs yet. Interactions will appear here.</div>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
          <Button size="sm" className="mt-2" onClick={() => setDebugLogs([])}>
            Clear Logs
          </Button>
        </div>
      )}
    </div>
  );
};

export { StreamUI };
