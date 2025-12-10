import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// המרת זיטונים לשקלים: ברירת מחדל 100 זיטונים = 1 שקל
// ניתן להעביר chipsPerShekel מותאם אישית
export function chipsToShekels(
  chips: number,
  chipsPerShekel: number = 100
): number {
  return chips / chipsPerShekel;
}

// המרת שקלים לזיטונים: ברירת מחדל 1 שקל = 100 זיטונים
// ניתן להעביר chipsPerShekel מותאם אישית
export function shekelsToChips(
  shekels: number,
  chipsPerShekel: number = 100
): number {
  return shekels * chipsPerShekel;
}

// פורמט זיטונים עם תווית
export function formatChips(chips: number | undefined | null): string {
  if (chips === undefined || chips === null || isNaN(chips)) {
    return "0 זיטונים";
  }
  return `${chips.toLocaleString()} זיטונים`;
}

// פורמט שקלים עם תווית
export function formatShekels(shekels: number): string {
  return `₪${shekels.toFixed(2)}`;
}
