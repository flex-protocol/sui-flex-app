import { SUI_DECIMALS } from "@mysten/sui.js/utils";

export function parseSui(amount: string) {
  const floatValue = parseFloat(amount);
  const multipliedValue = floatValue * Math.pow(10, SUI_DECIMALS);

  return multipliedValue.toString();
}

export function formatDateString(dateString: string) {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString(undefined, options);

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${time} - ${formattedDate}`;
}

export function hideHex(address?: string) {
  if (!address) return "";

  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`.toLowerCase();
}

export function extractTokenTypesFromXReserve({ type }: { type: string }) {
  const poolTokensType = type.substring(type.indexOf("<") + 1, type.indexOf(">")).split(",");
  const collectionType = poolTokensType[1].trim();

  return { collectionType };
}
