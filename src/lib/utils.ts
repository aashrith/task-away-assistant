import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes.
 * Used by shadcn/ui and AI Elements components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
