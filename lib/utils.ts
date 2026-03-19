/**
 * Lightweight `cn` utility — merges class strings, filtering falsy values.
 * Drop-in replacement for clsx + tailwind-merge without extra dependencies.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
