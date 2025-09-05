import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

export interface ChatInputProps {
  onSend?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  placeholder = "Send a message",
  disabled = false,
}) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && onSend) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return (
    <div className="relative flex items-center w-full">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-14 h-12 border-gray-600 text-white bg-neutral-800 text-base placeholder:text-[#98A2B3] rounded-md focus:border-[#314CB6] focus:ring-2 focus:ring-[#314CB6]/20"
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className="absolute right-4 h-8 w-8 p-0 rounded-full bg-[#314CB6] hover:bg-[#314CB6]/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
        size="sm"
      >
        <ArrowUp className="h-4 w-4 text-white" />
      </Button>
    </div>
  );
};

export { ChatInput };
