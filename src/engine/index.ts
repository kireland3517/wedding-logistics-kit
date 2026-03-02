import { validateBarInputs } from "./types.js";
import type { BarInputs, BarOutput } from "./types.js";
import { calculateRawServings } from "./consumption.js";
import { getBufferMultiplier, applyBuffer } from "./buffer.js";
import { allocateServings, convertToUnits } from "./allocation.js";

/**
 * Main entry point for the Bar Edition engine.
 *
 * Accepts unknown input for safe use with raw JSON, form data, or test fixtures.
 * Validates, computes, and returns a fully typed BarOutput.
 *
 * Pipeline:
 *   1. Validate inputs
 *   2. Calculate raw servings (before buffer)
 *   3. Determine buffer multiplier (non-stacking priority)
 *   4. Apply buffer → final servings
 *   5. Allocate final servings across beer / wine / spirits
 *   6. Convert to purchasable units (cases, bottles, liters)
 *   7. Return structured output
 *
 * @throws {ValidationError} if inputs fail validation
 */
export function calculateBar(inputs: unknown): BarOutput {
  // Step 1 — Validate and coerce to BarInputs
  const validated: BarInputs = validateBarInputs(inputs);

  // Step 2 — Raw servings before buffer
  const rawServings: number = calculateRawServings(validated);

  // Step 3 — Buffer multiplier (non-stacking priority)
  const bufferMultiplier: number = getBufferMultiplier(validated);

  // Step 4 — Apply buffer
  const finalServings: number = applyBuffer(rawServings, bufferMultiplier);

  // Step 5 — Allocate across categories
  const allocation = allocateServings(finalServings, validated.barType);

  // Step 6 — Convert to purchasable units
  const units = convertToUnits(allocation, validated.serviceStyle);

  // Step 7 — Return structured output
  return {
    totalServings: finalServings,
    beerCases: units.beerCases,
    wineBottles: units.wineBottles,
    spiritLiters: units.spiritLiters,
    bufferMultiplier,
  };
}

// Re-export public types and errors for consumers of this package
export type { BarInputs, BarOutput } from "./types.js";
export { ValidationError } from "./types.js";

// Package comparison (Use Case A)
export { calculatePackages } from "./packages.js";
export type {
  PackageInputs,
  PackageOutput,
  PackageAnalysis,
  VenuePackage,
  PackageTier,
  PackageVerdict,
  PackageMode,
} from "./types.js";
