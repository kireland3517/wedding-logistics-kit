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

// ─── Package Comparison Types (Use Case A) ────────────────────────────────────

export type PackageTier = "beer_wine" | "full" | "premium_spirits";
export type PackageVerdict = "good_fit" | "oversold" | "type_mismatch";
export type PackageMode = "comparison" | "single_evaluation";

export interface VenuePackage {
  id: string;
  name: string;
  tier: PackageTier;
  pricePerPerson: number;
}

export interface PackageInputs {
  totalGuests: number;
  percentNonDrinkers: number;
  eventHours: number;
  startTime: string;
  vibeLevel: VibeLevel;
  earlyExitRate: number;
  packages: VenuePackage[];
}

export interface PackageAnalysis {
  id: string;
  name: string;
  tier: PackageTier;
  pricePerPerson: number;
  totalCost: number;
  coverageScore: number;           // 0.0–1.0
  verdict: PackageVerdict;
  verdictReason: string;           // specific copy, never generic
  overpayingAmount: number | null; // dollars over recommended; null if this IS recommended
}

export interface PackageOutput {
  mode: PackageMode;
  estimatedServings: number;
  drinkingGuests: number;
  packages: PackageAnalysis[];
  recommendedId: string | null;    // null in single_evaluation mode
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

/** Validates PackageInputs. Throws ValidationError if invalid. */
export function validatePackageInputs(inputs: unknown): PackageInputs {
  if (typeof inputs !== "object" || inputs === null) {
    throw new ValidationError("Input must be a non-null object");
  }

  const raw = inputs as Record<string, unknown>;
  const validVibeLevels: VibeLevel[] = ["conservative", "standard", "party"];
  const validTiers: PackageTier[] = ["beer_wine", "full", "premium_spirits"];

  if (typeof raw["totalGuests"] !== "number" || !Number.isInteger(raw["totalGuests"]) || raw["totalGuests"] < 1) {
    throw new ValidationError("totalGuests must be a positive integer");
  }
  if (typeof raw["percentNonDrinkers"] !== "number" || raw["percentNonDrinkers"] < 0 || raw["percentNonDrinkers"] > 1) {
    throw new ValidationError("percentNonDrinkers must be a number between 0 and 1 inclusive");
  }
  if (typeof raw["eventHours"] !== "number" || raw["eventHours"] <= 0) {
    throw new ValidationError("eventHours must be a positive number");
  }
  if (typeof raw["startTime"] !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(raw["startTime"])) {
    throw new ValidationError('startTime must be in "HH:MM" 24-hour format');
  }
  if (!validVibeLevels.includes(raw["vibeLevel"] as VibeLevel)) {
    throw new ValidationError(`vibeLevel must be one of: ${validVibeLevels.join(", ")}`);
  }
  if (typeof raw["earlyExitRate"] !== "number" || raw["earlyExitRate"] < 0 || raw["earlyExitRate"] > 1) {
    throw new ValidationError("earlyExitRate must be a number between 0 and 1 inclusive");
  }
  if (!Array.isArray(raw["packages"]) || raw["packages"].length === 0) {
    throw new ValidationError("packages must be a non-empty array");
  }

  const packages: VenuePackage[] = (raw["packages"] as unknown[]).map((pkg, i) => {
    if (typeof pkg !== "object" || pkg === null) throw new ValidationError(`packages[${i}] must be an object`);
    const p = pkg as Record<string, unknown>;
    if (typeof p["id"] !== "string" || p["id"].trim().length === 0) throw new ValidationError(`packages[${i}].id must be a non-empty string`);
    if (typeof p["name"] !== "string" || p["name"].trim().length === 0) throw new ValidationError(`packages[${i}].name must be a non-empty string`);
    if (!validTiers.includes(p["tier"] as PackageTier)) throw new ValidationError(`packages[${i}].tier must be one of: ${validTiers.join(", ")}`);
    if (typeof p["pricePerPerson"] !== "number" || p["pricePerPerson"] < 0) throw new ValidationError(`packages[${i}].pricePerPerson must be a non-negative number`);
    return { id: p["id"] as string, name: p["name"] as string, tier: p["tier"] as PackageTier, pricePerPerson: p["pricePerPerson"] as number };
  });

  return {
    totalGuests: raw["totalGuests"] as number,
    percentNonDrinkers: raw["percentNonDrinkers"] as number,
    eventHours: raw["eventHours"] as number,
    startTime: raw["startTime"] as string,
    vibeLevel: raw["vibeLevel"] as VibeLevel,
    earlyExitRate: raw["earlyExitRate"] as number,
    packages,
  };
}
