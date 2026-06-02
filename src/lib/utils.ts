import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, "") // remove bold indicators
    .replace(/\*/g, "")   // remove single asterisks
    .replace(/#+/g, "")   // remove hashes
    .replace(/`/g, "");   // remove backticks
}
