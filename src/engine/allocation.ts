import type { BarInputs, AllocationResult } from "./types.js";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default proportional split across all three categories */
const DEFAULT_SPLIT = {
  beer: 0.4,
  wine: 0.35,
  spirits: 0.25,
} as const;

/**
 * Beer/wine-only split: the spirits 0.25 share is redistributed proportionally.
 *
 * Original beer:wine ratio = 0.40:0.35 = 8:7 (15 parts total)
 * beer_wine split: beer = 8/15, wine = 7/15, spirits = 0
 */
const BEER_WINE_SPLIT = {
  beer: 8 / 15,
  wine: 7 / 15,
  spirits: 0,
} as const;

/** Servings per wine bottle varies by service style */
const WINE_SERVINGS_PER_BOTTLE: Record<BarInputs["serviceStyle"], number> = {
  bartender: 5, // controlled pours
  self_pour: 4, // guests pour heavier
};

const BEER_SERVINGS_PER_CASE = 24;
const SPIRIT_SERVINGS_PER_LITER = 20;

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function getSplit(
  barType: BarInputs["barType"]
): typeof DEFAULT_SPLIT | typeof BEER_WINE_SPLIT {
  switch (barType) {
    case "beer_wine":
      return BEER_WINE_SPLIT;
    case "limited_spirits":
      // Stub hook for future extension — currently uses default split.
      // When limited_spirits business logic is defined, replace this case.
      return DEFAULT_SPLIT;
    case "full":
    default:
      return DEFAULT_SPLIT;
  }
}

// ─── Exported Pure Functions ──────────────────────────────────────────────────

/**
 * Splits final servings into per-category serving counts.
 * Returns exact (non-rounded) servings — unit conversion rounds separately.
 */
export function allocateServings(
  finalServings: number,
  barType: BarInputs["barType"]
): AllocationResult {
  const split = getSplit(barType);
  return {
    beerServings: finalServings * split.beer,
    wineServings: finalServings * split.wine,
    spiritServings: finalServings * split.spirits,
  };
}

/**
 * Converts raw serving counts into purchasable units.
 * All conversions use Math.ceil — always round up to avoid running short.
 *
 *   beerCases    = ceil(beerServings / 24)
 *   wineBottles  = ceil(wineServings / servingsPerBottle)
 *   spiritLiters = ceil(spiritServings / 20)
 */
export function convertToUnits(
  allocation: AllocationResult,
  serviceStyle: BarInputs["serviceStyle"]
): { beerCases: number; wineBottles: number; spiritLiters: number } {
  const servingsPerBottle = WINE_SERVINGS_PER_BOTTLE[serviceStyle];

  return {
    beerCases: Math.ceil(allocation.beerServings / BEER_SERVINGS_PER_CASE),
    wineBottles: Math.ceil(allocation.wineServings / servingsPerBottle),
    spiritLiters: Math.ceil(
      allocation.spiritServings / SPIRIT_SERVINGS_PER_LITER
    ),
  };
}
