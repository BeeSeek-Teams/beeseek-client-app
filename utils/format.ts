/**
 * Format a kobo amount into a compact Naira string for UI display.
 * Prevents long numbers from breaking layouts.
 *
 * Examples:
 *   formatNaira(0)           → "₦0"
 *   formatNaira(95000)       → "₦950"
 *   formatNaira(120000)      → "₦1.2K"
 *   formatNaira(1050000)     → "₦10.5K"
 *   formatNaira(10000000)    → "₦100K"
 *   formatNaira(150000000)   → "₦1.5M"
 *   formatNaira(1200000000)  → "₦12M"
 */
export function formatNairaCompact(kobo: number): string {
  const naira = kobo / 100;

  if (naira < 1000) {
    return `₦${naira.toLocaleString()}`;
  }
  if (naira < 1_000_000) {
    const k = naira / 1000;
    return `₦${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, '')}K`;
  }
  if (naira < 1_000_000_000) {
    const m = naira / 1_000_000;
    return `₦${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, '')}M`;
  }
  const b = naira / 1_000_000_000;
  return `₦${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1).replace(/\.0$/, '')}B`;
}

/**
 * Format kobo to full Naira string with commas (for non-compact contexts).
 * e.g. 120000 → "₦1,200"
 */
export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString()}`;
}
