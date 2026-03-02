import { validatePackageInputs } from "./types.js";
import type {
  PackageInputs,
  PackageOutput,
  PackageAnalysis,
  PackageTier,
  PackageVerdict,
  VibeLevel,
} from "./types.js";
import { calculateRawServings } from "./consumption.js";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Estimated fraction of total drinks that would be spirits, by crowd vibe.
 * Derived from observed catering industry splits and the existing allocation model.
 * standard (0.25) matches DEFAULT_SPLIT in allocation.ts exactly.
 */
const SPIRITS_FRACTION: Record<VibeLevel, number> = {
  conservative: 0.10,
  standard: 0.25,
  party: 0.35,
};

/** Minimum coverage score to qualify as "good fit" */
const GOOD_FIT_THRESHOLD = 0.85;

/** Tier ordering for oversold detection */
const TIER_RANK: Record<PackageTier, number> = {
  beer_wine: 0,
  full: 1,
  premium_spirits: 2,
};

// ─── Coverage ─────────────────────────────────────────────────────────────────

/**
 * Returns the fraction of expected drinks this package tier can serve.
 * beer_wine packages cannot serve spirits; full and premium cover everything.
 * Coverage is crowd-dependent because spirits demand varies by vibe.
 */
function getCoverageScore(tier: PackageTier, vibeLevel: VibeLevel): number {
  if (tier === "beer_wine") {
    return 1 - SPIRITS_FRACTION[vibeLevel];
  }
  return 1.0; // full and premium_spirits cover all drink types
}

// ─── Verdict Copy ─────────────────────────────────────────────────────────────

/**
 * Returns specific, actionable verdict copy for the given combination.
 * Every string is crowd-context-aware — never a generic label.
 */
function getVerdictReason(
  vibeLevel: VibeLevel,
  tier: PackageTier,
  verdict: PackageVerdict
): string {
  if (verdict === "good_fit") {
    if (tier === "beer_wine" && vibeLevel === "conservative") {
      return "Beer and wine covers your crowd well. No need to upgrade.";
    }
    if (tier === "full" && vibeLevel === "standard") {
      return "Full bar matches your crowd's pace. Cocktail access without overpaying for top-shelf.";
    }
    if (tier === "full" && vibeLevel === "party") {
      return "Full bar handles a high-energy crowd well. Your guests will be well-served.";
    }
    if (tier === "full" && vibeLevel === "conservative") {
      return "Full bar covers your crowd, though beer and wine alone would likely suffice.";
    }
    if (tier === "premium_spirits" && vibeLevel === "party") {
      return "Premium access suits a high-energy event, though standard full bar would serve most crowds equally well.";
    }
    return "This package covers your crowd's expected consumption.";
  }

  if (verdict === "oversold") {
    if (tier === "premium_spirits" && vibeLevel === "conservative") {
      return "Top-shelf spirits will go almost untouched. Fewer than 1 in 5 guests will appreciate the upgrade — the rest will stick to beer and wine.";
    }
    if (tier === "premium_spirits" && vibeLevel === "standard") {
      return "Your guests will enjoy cocktails, but won't notice top-shelf versus standard. Premium spirits rarely get used enough to justify the cost at a standard-pace event.";
    }
    if (tier === "premium_spirits" && vibeLevel === "party") {
      return "High-energy crowds drink more, but premium spirits don't get appreciated when volume is the priority. Standard full bar is the better value.";
    }
    if (tier === "full" && vibeLevel === "conservative") {
      return "Your crowd skews toward beer and wine. Spirits will see light use — you're paying a full bar premium for roughly 20–30% of your guests.";
    }
    return "This package provides more than your crowd profile typically uses.";
  }

  // type_mismatch
  if (tier === "beer_wine" && vibeLevel === "standard") {
    return "A standard-pace crowd will want at least some cocktail access. Beer and wine only tends to feel limiting by the second hour.";
  }
  if (tier === "beer_wine" && vibeLevel === "party") {
    return "A high-energy crowd without spirits access will notice. Beer and wine only creates friction at party-paced events.";
  }
  return "This package may not fully satisfy your crowd's drink preferences.";
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

/**
 * Analyzes venue bar packages against the crowd's expected consumption.
 *
 * Returns a comparison across all packages (mode: "comparison") or a single
 * evaluation if only one package is provided (mode: "single_evaluation").
 *
 * Key outputs:
 * - coverageScore: fraction of expected drinks this package can serve (0–1)
 * - verdict: good_fit | oversold | type_mismatch
 * - verdictReason: specific copy explaining the verdict in plain language
 * - overpayingAmount: dollars spent above the recommended package (null if IS recommended)
 *
 * @throws {ValidationError} if inputs fail validation
 */
export function calculatePackages(inputs: unknown): PackageOutput {
  const validated: PackageInputs = validatePackageInputs(inputs);

  // Use the shared consumption model — same crowd, same drinks estimate
  const estimatedServings = calculateRawServings({
    totalGuests: validated.totalGuests,
    percentNonDrinkers: validated.percentNonDrinkers,
    eventHours: validated.eventHours,
    startTime: validated.startTime,
    vibeLevel: validated.vibeLevel,
    earlyExitRate: validated.earlyExitRate,
    // buffer.ts fields not needed here — package comparison is pre-purchase planning
    state: "TX",
    onSiteLodging: false,
    barType: "full",
    serviceStyle: "bartender",
  });

  const drinkingGuests =
    validated.totalGuests * (1 - validated.percentNonDrinkers);

  // Score all packages
  const scored = validated.packages.map((pkg) => {
    const coverageScore = getCoverageScore(pkg.tier, validated.vibeLevel);
    const totalCost = pkg.pricePerPerson * validated.totalGuests;
    return { pkg, coverageScore, totalCost };
  });

  // Find the recommended package: lowest price among good-fit packages
  const goodFit = scored.filter((s) => s.coverageScore >= GOOD_FIT_THRESHOLD);
  const recommended = goodFit.length > 0
    ? goodFit.reduce((best, cur) =>
        cur.pkg.pricePerPerson < best.pkg.pricePerPerson ? cur : best
      )
    : null;

  const recommendedId = recommended?.pkg.id ?? null;

  // Build analysis for each package
  const packages: PackageAnalysis[] = scored.map(({ pkg, coverageScore, totalCost }) => {
    // Determine verdict
    let verdict: PackageVerdict;
    if (coverageScore < GOOD_FIT_THRESHOLD) {
      verdict = "type_mismatch";
    } else if (
      recommended !== null &&
      TIER_RANK[pkg.tier] > TIER_RANK[recommended.pkg.tier]
    ) {
      verdict = "oversold";
    } else {
      verdict = "good_fit";
    }

    const verdictReason = getVerdictReason(validated.vibeLevel, pkg.tier, verdict);

    const overpayingAmount =
      recommended !== null && pkg.id !== recommendedId
        ? Math.round((pkg.pricePerPerson - recommended.pkg.pricePerPerson) * validated.totalGuests)
        : null;

    return {
      id: pkg.id,
      name: pkg.name,
      tier: pkg.tier,
      pricePerPerson: pkg.pricePerPerson,
      totalCost,
      coverageScore,
      verdict,
      verdictReason,
      overpayingAmount,
    };
  });

  return {
    mode: validated.packages.length === 1 ? "single_evaluation" : "comparison",
    estimatedServings,
    drinkingGuests,
    packages,
    recommendedId,
  };
}
