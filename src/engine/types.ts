// ─── Domain Types ─────────────────────────────────────────────────────────────

export type VibeLevel = "conservative" | "standard" | "party";
export type BarType = "full" | "beer_wine" | "limited_spirits";
export type ServiceStyle = "bartender" | "self_pour";

// ─── Input Interface ──────────────────────────────────────────────────────────

export interface BarInputs {
  totalGuests: number;
  percentNonDrinkers: number; // 0.0 – 1.0
  eventHours: number;
  startTime: string; // "HH:MM" 24-hour format
  vibeLevel: VibeLevel;
  earlyExitRate: number; // 0.0 – 1.0
  state: string;
  onSiteLodging: boolean;
  barType: BarType;
  serviceStyle: ServiceStyle;
}

// ─── Output Interface ─────────────────────────────────────────────────────────

export interface BarOutput {
  totalServings: number;
  beerCases: number;
  wineBottles: number;
  spiritLiters: number;
  bufferMultiplier: number;
}

// ─── Internal Intermediate Types ──────────────────────────────────────────────

/** Servings split by category before unit conversion */
export interface AllocationResult {
  beerServings: number;
  wineServings: number;
  spiritServings: number;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validates all BarInputs fields. Returns a validated, trimmed copy if valid.
 * Throws ValidationError with a descriptive message if any field is invalid.
 *
 * Accepts `unknown` so it can safely be called on raw JSON, API payloads,
 * or test data without false type safety.
 */
export function validateBarInputs(inputs: unknown): BarInputs {
  if (typeof inputs !== "object" || inputs === null) {
    throw new ValidationError("Input must be a non-null object");
  }

  const raw = inputs as Record<string, unknown>;

  // totalGuests — positive integer
  if (
    typeof raw["totalGuests"] !== "number" ||
    !Number.isInteger(raw["totalGuests"]) ||
    raw["totalGuests"] < 1
  ) {
    throw new ValidationError("totalGuests must be a positive integer");
  }

  // percentNonDrinkers — 0 to 1 inclusive
  if (
    typeof raw["percentNonDrinkers"] !== "number" ||
    raw["percentNonDrinkers"] < 0 ||
    raw["percentNonDrinkers"] > 1
  ) {
    throw new ValidationError(
      "percentNonDrinkers must be a number between 0 and 1 inclusive"
    );
  }

  // eventHours — positive number
  if (typeof raw["eventHours"] !== "number" || raw["eventHours"] <= 0) {
    throw new ValidationError("eventHours must be a positive number");
  }

  // startTime — "HH:MM" 24-hour format
  if (
    typeof raw["startTime"] !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(raw["startTime"])
  ) {
    throw new ValidationError(
      'startTime must be in "HH:MM" 24-hour format (e.g., "14:30")'
    );
  }

  // vibeLevel — union member
  const validVibeLevels: VibeLevel[] = ["conservative", "standard", "party"];
  if (!validVibeLevels.includes(raw["vibeLevel"] as VibeLevel)) {
    throw new ValidationError(
      `vibeLevel must be one of: ${validVibeLevels.join(", ")}`
    );
  }

  // earlyExitRate — 0 to 1 inclusive
  if (
    typeof raw["earlyExitRate"] !== "number" ||
    raw["earlyExitRate"] < 0 ||
    raw["earlyExitRate"] > 1
  ) {
    throw new ValidationError(
      "earlyExitRate must be a number between 0 and 1 inclusive"
    );
  }

  // state — non-empty string
  if (typeof raw["state"] !== "string" || raw["state"].trim().length === 0) {
    throw new ValidationError("state must be a non-empty string");
  }

  // onSiteLodging — boolean
  if (typeof raw["onSiteLodging"] !== "boolean") {
    throw new ValidationError("onSiteLodging must be a boolean");
  }

  // barType — union member
  const validBarTypes: BarType[] = ["full", "beer_wine", "limited_spirits"];
  if (!validBarTypes.includes(raw["barType"] as BarType)) {
    throw new ValidationError(
      `barType must be one of: ${validBarTypes.join(", ")}`
    );
  }

  // serviceStyle — union member
  const validServiceStyles: ServiceStyle[] = ["bartender", "self_pour"];
  if (!validServiceStyles.includes(raw["serviceStyle"] as ServiceStyle)) {
    throw new ValidationError(
      `serviceStyle must be one of: ${validServiceStyles.join(", ")}`
    );
  }

  return {
    totalGuests: raw["totalGuests"] as number,
    percentNonDrinkers: raw["percentNonDrinkers"] as number,
    eventHours: raw["eventHours"] as number,
    startTime: raw["startTime"] as string,
    vibeLevel: raw["vibeLevel"] as VibeLevel,
    earlyExitRate: raw["earlyExitRate"] as number,
    state: (raw["state"] as string).trim(),
    onSiteLodging: raw["onSiteLodging"] as boolean,
    barType: raw["barType"] as BarType,
    serviceStyle: raw["serviceStyle"] as ServiceStyle,
  };
}
