import { describe, it, expect } from "vitest";
import { calculateBar, ValidationError } from "../src/engine/index.js";

// ─── Fixture Builder ──────────────────────────────────────────────────────────

/**
 * Returns a fully valid base BarInputs object.
 * Individual tests override specific fields using spread syntax.
 *
 * Base: 100 guests, 20% non-drinkers, 4 hours, 17:00 start, standard vibe,
 *       10% early exit, Texas, no lodging, full bar, bartender service.
 *
 * Base manual derivation (earlyExitRate=0.1, startTime="17:00"):
 *   DG = 100 × (1 - 0.2) = 80
 *   V_adj = 1.5 + 0 = 1.5  (standard vibe, 17:00 is not < 15:00 or > 18:00)
 *   baseline = 80 × 4 × 1.5 = 480
 *   surge = 80 × 0.5 = 40  (eventHours 4 ≥ 1.5)
 *   earlyExit = 80 × 0.1 × 1.5 = 12
 *   rawServings = 480 + 40 - 12 = 508
 *   multiplier = 1.10  (Texas, no lodging)
 *   finalServings = 508 × 1.10 = 558.8
 */
function makeInputs(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    totalGuests: 100,
    percentNonDrinkers: 0.2,
    eventHours: 4,
    startTime: "17:00",
    vibeLevel: "standard",
    earlyExitRate: 0.1,
    state: "Texas",
    onSiteLodging: false,
    barType: "full",
    serviceStyle: "bartender",
    ...overrides,
  };
}

// ─── Test 1: Short Event (≤ 2 hours) ─────────────────────────────────────────

describe("Test 1: Short event (2 hours)", () => {
  /**
   * Overrides: eventHours=2, earlyExitRate=0, startTime="17:00"
   *
   * DG = 80, V_adj = 1.5
   * baseline = 80 × 2 × 1.5 = 240
   * surge: eventHours=2 ≥ 1.5 → 80 × 0.5 = 40
   * earlyExit = 80 × 0 × 1.5 = 0
   * rawServings = 240 + 40 = 280
   * multiplier = 1.10  (Texas, no lodging)
   * finalServings = 280 × 1.10 = 308
   *
   * split (full): beer=0.40, wine=0.35, spirits=0.25
   * beerServings = 308 × 0.40 = 123.2  → beerCases   = ceil(123.2/24) = ceil(5.133) = 6
   * wineServings = 308 × 0.35 = 107.8  → wineBottles = ceil(107.8/5)  = ceil(21.56) = 22
   * spiritServings = 308 × 0.25 = 77   → spiritLiters = ceil(77/20)   = ceil(3.85)  = 4
   */
  it("produces correct output for a 2-hour event with no early exit", () => {
    const result = calculateBar(makeInputs({
      eventHours: 2,
      earlyExitRate: 0,
    }));

    expect(result.totalServings).toBeCloseTo(308, 5);
    expect(result.bufferMultiplier).toBe(1.1);
    expect(result.beerCases).toBe(6);
    expect(result.wineBottles).toBe(22);
    expect(result.spiritLiters).toBe(4);
  });

  it("uses medium surge (0.25×DG) for an event between 1 and 1.5 hours", () => {
    /**
     * eventHours=1.2, earlyExitRate=0
     * surge: 1.0 ≤ 1.2 < 1.5 → 80 × 0.25 = 20
     * baseline = 80 × 1.2 × 1.5 = 144
     * rawServings = 144 + 20 = 164
     * finalServings = 164 × 1.10 = 180.4
     */
    const result = calculateBar(makeInputs({ eventHours: 1.2, earlyExitRate: 0 }));
    expect(result.totalServings).toBeCloseTo(180.4, 5);
  });

  it("uses zero surge for an event under 1 hour", () => {
    /**
     * eventHours=0.5, earlyExitRate=0
     * surge = 0  (eventHours < SURGE_LOW_HOURS_MIN of 1.0)
     * baseline = 80 × 0.5 × 1.5 = 60
     * rawServings = 60
     * finalServings = 60 × 1.10 = 66
     */
    const result = calculateBar(makeInputs({ eventHours: 0.5, earlyExitRate: 0 }));
    expect(result.totalServings).toBeCloseTo(66, 5);
  });
});

// ─── Test 2: Non-Return State (Ohio) ─────────────────────────────────────────

describe("Test 2: Non-return state (Ohio)", () => {
  /**
   * state="Ohio", earlyExitRate=0.1 (base)
   *
   * rawServings = 508  (see base fixture derivation above)
   * onSiteLodging=false, state="Ohio" → multiplier = 1.05
   * finalServings = 508 × 1.05 = 533.4
   */
  it("applies the 1.05 non-return multiplier for Ohio", () => {
    const result = calculateBar(makeInputs({ state: "Ohio" }));

    expect(result.bufferMultiplier).toBe(1.05);
    expect(result.totalServings).toBeCloseTo(533.4, 3);
  });

  it("matches Ohio regardless of input casing", () => {
    const lower = calculateBar(makeInputs({ state: "ohio" }));
    const upper = calculateBar(makeInputs({ state: "OHIO" }));
    const mixed = calculateBar(makeInputs({ state: "Ohio" }));

    expect(lower.bufferMultiplier).toBe(1.05);
    expect(upper.bufferMultiplier).toBe(1.05);
    expect(mixed.bufferMultiplier).toBe(1.05);
  });

  it("uses default 1.10 multiplier for non-Ohio states", () => {
    const result = calculateBar(makeInputs({ state: "Texas" }));
    expect(result.bufferMultiplier).toBe(1.1);
  });
});

// ─── Test 3: On-Site Lodging Override ────────────────────────────────────────

describe("Test 3: On-site lodging overrides all other multipliers", () => {
  it("uses 1.20 multiplier when onSiteLodging is true (Texas)", () => {
    const result = calculateBar(makeInputs({ onSiteLodging: true }));
    expect(result.bufferMultiplier).toBe(1.2);
  });

  it("overrides the Ohio non-return multiplier when onSiteLodging is true", () => {
    /**
     * onSiteLodging=true takes priority over state="Ohio"
     * rawServings = 508
     * multiplier = 1.20  (not 1.05, not 1.10)
     * finalServings = 508 × 1.20 = 609.6
     */
    const result = calculateBar(makeInputs({ onSiteLodging: true, state: "Ohio" }));

    expect(result.bufferMultiplier).toBe(1.2);
    expect(result.totalServings).toBeCloseTo(609.6, 3);
  });

  it("produces higher total servings than default when lodging is true", () => {
    const withLodging = calculateBar(makeInputs({ onSiteLodging: true }));
    const withoutLodging = calculateBar(makeInputs({ onSiteLodging: false }));

    expect(withLodging.totalServings).toBeGreaterThan(withoutLodging.totalServings);
  });
});

// ─── Test 4: Beer/Wine Only Mode ─────────────────────────────────────────────

describe("Test 4: Beer/wine only barType", () => {
  /**
   * barType="beer_wine"
   *
   * finalServings = 558.8  (base fixture)
   * split (beer_wine): beer=8/15, wine=7/15, spirits=0
   * beerServings = 558.8 × (8/15) ≈ 298.027  → beerCases   = ceil(298.027/24) = ceil(12.418) = 13
   * wineServings = 558.8 × (7/15) ≈ 260.773  → wineBottles = ceil(260.773/5)  = ceil(52.155) = 53
   * spiritServings = 0                         → spiritLiters = 0
   */
  it("produces zero spirit liters and redistributes proportionally to beer/wine", () => {
    const result = calculateBar(makeInputs({ barType: "beer_wine" }));

    expect(result.spiritLiters).toBe(0);
    expect(result.beerCases).toBe(13);
    expect(result.wineBottles).toBe(53);
  });

  it("beer and wine splits together cover 100% of final servings", () => {
    // 8/15 + 7/15 = 1.0 — spirits allocation is fully redistributed
    const result = calculateBar(makeInputs({ barType: "beer_wine" }));
    expect(result.spiritLiters).toBe(0);
    expect(result.totalServings).toBeGreaterThan(0);
  });

  it("uses higher wine bottle count for self_pour than bartender", () => {
    // self_pour uses 4 servings/bottle vs bartender 5, so more bottles needed
    const bartender = calculateBar(makeInputs({ barType: "beer_wine", serviceStyle: "bartender" }));
    const selfPour  = calculateBar(makeInputs({ barType: "beer_wine", serviceStyle: "self_pour" }));

    expect(selfPour.wineBottles).toBeGreaterThanOrEqual(bartender.wineBottles);
  });
});

// ─── Test 5: Early Exit 0% ────────────────────────────────────────────────────

describe("Test 5: Early exit rate of 0%", () => {
  /**
   * earlyExitRate=0 → earlyExit = DG × 0 × V_adj = 0
   *
   * rawServings = 480 + 40 - 0 = 520
   * multiplier = 1.10
   * finalServings = 520 × 1.10 = 572
   */
  it("matches manual calculation for 0% early exit", () => {
    const result = calculateBar(makeInputs({ earlyExitRate: 0 }));
    expect(result.totalServings).toBeCloseTo(572, 5);
  });

  it("produces the highest total servings of all exit rates", () => {
    const noExit   = calculateBar(makeInputs({ earlyExitRate: 0 }));
    const someExit = calculateBar(makeInputs({ earlyExitRate: 0.1 }));
    const halfExit = calculateBar(makeInputs({ earlyExitRate: 0.5 }));

    expect(noExit.totalServings).toBeGreaterThan(someExit.totalServings);
    expect(someExit.totalServings).toBeGreaterThan(halfExit.totalServings);
  });
});

// ─── Test 6: Early Exit 50% ──────────────────────────────────────────────────

describe("Test 6: Early exit rate of 50%", () => {
  /**
   * earlyExitRate=0.5
   *
   * DG=80, V_adj=1.5
   * baseline = 80 × 4 × 1.5 = 480
   * surge = 80 × 0.5 = 40
   * earlyExit = 80 × 0.5 × 1.5 = 60
   * rawServings = max(0, 480 + 40 - 60) = 460
   * multiplier = 1.10
   * finalServings = 460 × 1.10 = 506
   */
  it("correctly deducts 50% early exit from raw servings", () => {
    const result = calculateBar(makeInputs({ earlyExitRate: 0.5 }));

    expect(result.totalServings).toBeCloseTo(506, 5);
    expect(result.bufferMultiplier).toBe(1.1);
  });

  it("produces fewer total servings than 0% early exit", () => {
    const noExit   = calculateBar(makeInputs({ earlyExitRate: 0 }));
    const halfExit = calculateBar(makeInputs({ earlyExitRate: 0.5 }));

    expect(halfExit.totalServings).toBeLessThan(noExit.totalServings);
  });
});

// ─── Validation Edge Cases ────────────────────────────────────────────────────

describe("Validation edge cases", () => {
  it("throws ValidationError for totalGuests = 0", () => {
    expect(() => calculateBar(makeInputs({ totalGuests: 0 }))).toThrow(ValidationError);
  });

  it("throws ValidationError for fractional totalGuests", () => {
    expect(() => calculateBar(makeInputs({ totalGuests: 99.5 }))).toThrow(ValidationError);
  });

  it("throws ValidationError for percentNonDrinkers > 1", () => {
    expect(() => calculateBar(makeInputs({ percentNonDrinkers: 1.1 }))).toThrow(ValidationError);
  });

  it("throws ValidationError for negative percentNonDrinkers", () => {
    expect(() => calculateBar(makeInputs({ percentNonDrinkers: -0.1 }))).toThrow(ValidationError);
  });

  it("throws ValidationError for invalid startTime format (single-digit hour)", () => {
    expect(() => calculateBar(makeInputs({ startTime: "9:00" }))).toThrow(ValidationError);
  });

  it("throws ValidationError for startTime hour out of range", () => {
    expect(() => calculateBar(makeInputs({ startTime: "25:00" }))).toThrow(ValidationError);
  });

  it("throws ValidationError for startTime minute out of range", () => {
    expect(() => calculateBar(makeInputs({ startTime: "14:60" }))).toThrow(ValidationError);
  });

  it("throws ValidationError for invalid vibeLevel", () => {
    expect(() => calculateBar(makeInputs({ vibeLevel: "wild" }))).toThrow(ValidationError);
  });

  it("throws ValidationError for invalid barType", () => {
    expect(() => calculateBar(makeInputs({ barType: "keg_only" }))).toThrow(ValidationError);
  });

  it("throws ValidationError for empty state string", () => {
    expect(() => calculateBar(makeInputs({ state: "  " }))).toThrow(ValidationError);
  });

  it("clamps rawServings to 0 for extreme early exit with short conservative event", () => {
    // eventHours=0.5, vibeLevel=conservative, earlyExitRate=1.0
    // V_adj = 1.0 + 0 = 1.0
    // baseline = 80 × 0.5 × 1.0 = 40
    // surge = 0  (eventHours < 1.0)
    // earlyExit = 80 × 1.0 × 1.0 = 80
    // rawServings = max(0, 40 + 0 - 80) = max(0, -40) = 0
    // finalServings = 0 × 1.10 = 0
    const result = calculateBar(makeInputs({
      earlyExitRate: 1.0,
      vibeLevel: "conservative",
      eventHours: 0.5,
    }));
    expect(result.totalServings).toBe(0);
    expect(result.beerCases).toBe(0);
    expect(result.wineBottles).toBe(0);
    expect(result.spiritLiters).toBe(0);
  });

  it("accepts percentNonDrinkers = 1.0 (all non-drinkers → zero servings)", () => {
    // DG = 100 × (1 - 1.0) = 0 → all outputs = 0
    const result = calculateBar(makeInputs({ percentNonDrinkers: 1.0 }));
    expect(result.totalServings).toBe(0);
    expect(result.beerCases).toBe(0);
    expect(result.wineBottles).toBe(0);
    expect(result.spiritLiters).toBe(0);
  });
});

// ─── Time Modifier Edge Cases ─────────────────────────────────────────────────

describe("Time modifier behavior", () => {
  it("applies -0.25 modifier for startTime < 15:00 (daytime event)", () => {
    /**
     * startTime="12:00", standard vibe → V_adj = 1.5 - 0.25 = 1.25
     * baseline = 80 × 4 × 1.25 = 400
     * surge = 80 × 0.5 = 40
     * earlyExit = 80 × 0.1 × 1.25 = 10
     * rawServings = 400 + 40 - 10 = 430
     * finalServings = 430 × 1.10 = 473
     */
    const result = calculateBar(makeInputs({ startTime: "12:00" }));
    expect(result.totalServings).toBeCloseTo(473, 5);
  });

  it("applies +0.15 modifier for startTime > 18:00 (evening event)", () => {
    /**
     * startTime="20:00", standard vibe → V_adj = 1.5 + 0.15 = 1.65
     * baseline = 80 × 4 × 1.65 = 528
     * surge = 80 × 0.5 = 40
     * earlyExit = 80 × 0.1 × 1.65 = 13.2
     * rawServings = 528 + 40 - 13.2 = 554.8
     * finalServings = 554.8 × 1.10 = 610.28
     */
    const result = calculateBar(makeInputs({ startTime: "20:00" }));
    expect(result.totalServings).toBeCloseTo(610.28, 3);
  });

  it("applies zero modifier for startTime exactly at 15:00 boundary", () => {
    /**
     * "15:00" is not < "15:00", so modifier = 0 (falls to else branch)
     * Same as 17:00 base: finalServings = 558.8
     */
    const result = calculateBar(makeInputs({ startTime: "15:00" }));
    expect(result.totalServings).toBeCloseTo(558.8, 3);
  });

  it("applies zero modifier for startTime exactly at 18:00 boundary", () => {
    /**
     * "18:00" is not > "18:00", so modifier = 0 (falls to else branch)
     */
    const result = calculateBar(makeInputs({ startTime: "18:00" }));
    expect(result.totalServings).toBeCloseTo(558.8, 3);
  });
});
