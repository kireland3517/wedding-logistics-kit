import type { BarInputs } from "./types.js";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * States classified as "non-return" for inventory purposes.
 * Venues in these states cannot return unopened bottles, so a smaller buffer
 * is used to avoid purchasing excess that cannot be refunded.
 * Matched case-insensitively at lookup time.
 */
const NON_RETURN_STATES = new Set(["ohio"]);

const MULTIPLIER_ON_SITE_LODGING = 1.2;
const MULTIPLIER_NON_RETURN_STATE = 1.05;
const MULTIPLIER_DEFAULT = 1.1;

// ─── Exported Pure Functions ──────────────────────────────────────────────────

/**
 * Returns the buffer multiplier to apply to rawServings.
 *
 * Priority order (NON-STACKING — first match wins):
 *   1. onSiteLodging = true  → 1.20  (guests staying on-site drink more)
 *   2. non-return state      → 1.05  (can't return excess; buy conservatively)
 *   3. default               → 1.10
 *
 * Non-stacking is a deliberate business rule: lodging already accounts for
 * the behavioral shift of not driving, so stacking the state rule would
 * double-count that factor.
 */
export function getBufferMultiplier(inputs: BarInputs): number {
  if (inputs.onSiteLodging) {
    return MULTIPLIER_ON_SITE_LODGING;
  }

  if (NON_RETURN_STATES.has(inputs.state.toLowerCase())) {
    return MULTIPLIER_NON_RETURN_STATE;
  }

  return MULTIPLIER_DEFAULT;
}

/**
 * Applies the buffer multiplier to rawServings.
 *   finalServings = rawServings × multiplier
 */
export function applyBuffer(rawServings: number, multiplier: number): number {
  return rawServings * multiplier;
}
