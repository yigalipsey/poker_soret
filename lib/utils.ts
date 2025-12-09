import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// המרת זיטונים לשקלים: 1000 זיטונים = 1 שקל
export function chipsToShekels(chips: number): number {
  return chips / 1000;
}

// המרת שקלים לזיטונים: 1 שקל = 1000 זיטונים
export function shekelsToChips(shekels: number): number {
  return shekels * 1000;
}

// פורמט זיטונים עם תווית
export function formatChips(chips: number): string {
  return `${chips.toLocaleString()} זיטונים`;
}

// פורמט שקלים עם תווית
export function formatShekels(shekels: number): string {
  return `₪${shekels.toFixed(2)}`;
}
