import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Conditional className helper. Merges clsx output through tailwind-merge so
 * conflicting utility classes resolve predictably. Safe to use even though the
 * project styles primarily with CSS variables — it degrades to plain clsx.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
