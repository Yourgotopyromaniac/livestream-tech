import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { AccessToken } from "livekit-server-sdk";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatarBgColor(name?: string) {
  if (!name || name.length === 0) return "bg-gray-400";

  const firstChar = name[0].toUpperCase();

  if (firstChar >= "A" && firstChar <= "G") return "bg-[#FF692E]";
  if (firstChar >= "H" && firstChar <= "P") return "bg-[#0E9384]";
  if (firstChar >= "Q" && firstChar <= "V") return "bg-[#1570EF]";
  if (firstChar >= "W" && firstChar <= "Z") return "bg-[#CA8504]";

  return "bg-gray-400";
}

export function getAvatarAltBgColor(name?: string) {
  if (!name || name.length === 0) return "bg-gray-400";

  const firstChar = name[0].toUpperCase();

  if (firstChar >= "A" && firstChar <= "B") return "bg-[#FFE6D5]";
  if (firstChar >= "C" && firstChar <= "G") return "bg-[#FEF7C3]";
  if (firstChar >= "H" && firstChar <= "P") return "bg-[#CFF9FE]";
  if (firstChar >= "Q" && firstChar <= "V") return "bg-[#ECE9FE]";
  if (firstChar >= "W" && firstChar <= "Z") return "bg-[#E6F4D7]";

  return "bg-gray-400";
}

export const getDaysInMonth = (month: number, year: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dayName = date
      .toLocaleDateString("en-US", { weekday: "short" })
      .charAt(0);
    days.push({
      day: i,
      dayName,
      date: date,
      label: `${dayName}${i.toString().padStart(2, "0")}`,
    });
  }

  return days;
};

export const getDayPrefix = (day: Date) => {
  return format(day, "EEE").charAt(0);
};

export const formatNumber = (num: string | number) => {
  const numValue =
    typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;
  if (isNaN(numValue)) {
    return "0";
  }

  if (numValue >= 1000000) {
    const millions = numValue / 1000000;
    if (millions >= 10 || millions % 1 === 0) {
      return `${Math.round(millions)}M`;
    } else {
      return `${millions.toFixed(1).replace(".0", "")}M`;
    }
  } else if (numValue >= 1000) {
    const thousands = numValue / 1000;
    if (thousands % 1 === 0) {
      return `${thousands}K`;
    } else {
      return `${thousands.toFixed(1).replace(".0", "")}K`;
    }
  }
  return numValue.toLocaleString();
};

export function generateTestToken(
  apiKey: string,
  apiSecret: string,
  roomName: string,
  identity: string,
  name: string,
  isHost: boolean
) {
  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: isHost, // host publishes
    canSubscribe: true, // both can subscribe
  });

  return at.toJwt();
}
