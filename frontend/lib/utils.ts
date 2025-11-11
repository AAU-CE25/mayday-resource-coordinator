import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// add a small helper to normalise location rendering
export function formatAddress(loc: any): string {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object") {
    if ("address" in loc && typeof loc.address === "string") return loc.address;
    const parts = [loc.street, loc.city, loc.postcode, loc.country].filter(Boolean);
    if (parts.length) return parts.join(", ");
  }
  return "";
}