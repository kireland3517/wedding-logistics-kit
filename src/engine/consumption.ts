import type { BarInputs, VibeLevel } from "./types.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const VIBE_BASE: Record<VibeLevel, number> = {
  conservative: 1.0,
  standard: 1.5,
  party: 2.0,
};

// Thresholds for time-of-day modifier using "HH:MM" string comparison.
// Lexicographic order equals chronological order for zero-padded 24h times.
const EARLY_START_THRESHOLD = "15:00";
const LATE_START_THRESHOLD = "18:00";
const EARLY_START_MODIFIER = -0.25;
const LATE_START_MODIFIER = 0.15;

// Surge tiers based on event duration
const SURGE_HIGH_HOURS_MIN = 1.5; // eventHours >= this → high surge
const SURGE_LOW_HOURS_MIN = 1.0; // eventHours >= this (and < 1.5) → low surge
const SURGE_HIGH_MULTIPLIER = 0.5;
const SURGE_LOW_MULTIPLIER = 0.25;

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Returns the time-of-day modifier for V_adj.
 * String comparison is valid: "HH:MM" lexicographic order = chronological order.
 * Boundary values ("15:00", "18:00") fall into the zero-modifier branch.
 */
function getTimeModifier(startTime: string): number {
  if (startTime < EARLY_START_THRESHOLD) return EARLY_START_MODIFIER;
  if (startTime > LATE_START_THRESHOLD) return LATE_START_MODIFIER;
  return 0;
}

/**
 * Returns the initial-rush surge servings based on event duration tier.
 * Surge is a flat DG-based offset — it does not scale with V_adj.
 */
function calculateSurge(dg: number, eventHours: number): number {
  if (eventHours >= SURGE_HIGH_HOURS_MIN) return dg * SURGE_HIGH_MULTIPLIER;
  if (eventHours >= SURGE_LOW_HOURS_MIN) return dg * SURGE_LOW_MULTIPLIER;
  return 0;
}

// ─── Exported Pure Functions ──────────────────────────────────────────────────

/**
 * Derives the number of drinking guests from total headcount.
 *   DG = totalGuests × (1 - percentNonDrinkers)
 */
export function deriveDrinkingGuests(
  totalGuests: number,
  percentNonDrinkers: number
): number {
  return totalGuests * (1 - percentNonDrinkers);
}

/**
 * Computes the adjusted vibe multiplier (V_adj).
 *   V_adj = VIBE_BASE[vibeLevel] + timeModifier(startTime)
 */
export function calculateVibeAdjusted(
  vibeLevel: VibeLevel,
  startTime: string
): number {
  return VIBE_BASE[vibeLevel] + getTimeModifier(startTime);
}

/**
 * Calculates total raw servings before buffer is applied.
 *
 *   baseline  = DG × eventHours × V_adj
 *   surge     = DG × tier_multiplier(eventHours)
 *   earlyExit = DG × earlyExitRate × V_adj
 *   rawServings = max(0, baseline + surge - earlyExit)
 *
 * The max(0, ...) guard handles the edge case where earlyExit exceeds
 * baseline + surge (e.g., very short event + 100% early exit rate).
 */
export function calculateRawServings(inputs: BarInputs): number {
  const dg = deriveDrinkingGuests(inputs.totalGuests, inputs.percentNonDrinkers);
  const vAdj = calculateVibeAdjusted(inputs.vibeLevel, inputs.startTime);
  const baseline = dg * inputs.eventHours * vAdj;
  const surge = calculateSurge(dg, inputs.eventHours);
  const earlyExit = dg * inputs.earlyExitRate * vAdj;

  return Math.max(0, baseline + surge - earlyExit);
}
