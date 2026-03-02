import type { PackageOutput, PackageAnalysis } from "@engine/index";

interface Props {
  result: PackageOutput | null;
}

const VERDICT_ICON: Record<string, string> = {
  good_fit: "✓",
  oversold: "⚠",
  type_mismatch: "✗",
};

const VERDICT_CLASS: Record<string, string> = {
  good_fit: "verdict--good",
  oversold: "verdict--warn",
  type_mismatch: "verdict--bad",
};

function formatDollars(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

function CoverageBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="coverage-bar-wrap" title={`${pct}% of expected drinks covered`}>
      <div className="coverage-bar">
        <div className="coverage-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="coverage-pct">{pct}%</span>
    </div>
  );
}

function SingleEvaluation({ pkg }: { pkg: PackageAnalysis }) {
  return (
    <div className="results-panel">
      <div className="results-header">
        <span className="results-label">Package Evaluation</span>
        <span className={`verdict-badge ${VERDICT_CLASS[pkg.verdict]}`}>
          {VERDICT_ICON[pkg.verdict]}{" "}
          {pkg.verdict === "good_fit" ? "Good Fit" : pkg.verdict === "oversold" ? "Oversold" : "Limited Coverage"}
        </span>
      </div>

      <div className="single-eval-card">
        <div className="single-eval-row">
          <span className="single-eval-label">{pkg.name}</span>
          <span className="single-eval-price">{formatDollars(pkg.pricePerPerson)}/person</span>
        </div>
        <div className="single-eval-row">
          <span className="single-eval-label">Total cost</span>
          <span className="single-eval-price">{formatDollars(pkg.totalCost)}</span>
        </div>
        <div className="single-eval-coverage">
          <span className="single-eval-label">Drinks coverage</span>
          <CoverageBar score={pkg.coverageScore} />
        </div>
      </div>

      <p className="verdict-reason">{pkg.verdictReason}</p>

      <button className="print-btn" type="button" onClick={() => window.print()}>
        Print / Save as PDF
      </button>
    </div>
  );
}

function ComparisonTable({
  result,
  totalGuests,
}: {
  result: PackageOutput;
  totalGuests: number;
}) {
  const recommended = result.packages.find((p) => p.id === result.recommendedId);

  return (
    <div className="results-panel">
      <div className="results-header">
        <span className="results-label">Package Comparison</span>
        <span className="results-meta">
          ~{Math.ceil(result.estimatedServings)} drinks · {Math.round(result.drinkingGuests)} drinking guests
        </span>
      </div>

      <div className="package-table">
        {result.packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`package-table-row${pkg.id === result.recommendedId ? " package-table-row--recommended" : ""}`}
          >
            <div className="pkg-name-col">
              <span className="pkg-name">{pkg.name}</span>
              {pkg.id === result.recommendedId && (
                <span className="recommended-badge">Recommended</span>
              )}
            </div>

            <div className="pkg-price-col">
              <span className="pkg-price-pp">{formatDollars(pkg.pricePerPerson)}/pp</span>
              <span className="pkg-price-total">{formatDollars(pkg.totalCost)} total</span>
            </div>

            <div className="pkg-coverage-col">
              <CoverageBar score={pkg.coverageScore} />
            </div>

            <div className="pkg-verdict-col">
              <span className={`verdict-badge ${VERDICT_CLASS[pkg.verdict]}`}>
                {VERDICT_ICON[pkg.verdict]}{" "}
                {pkg.verdict === "good_fit"
                  ? "Good Fit"
                  : pkg.verdict === "oversold"
                  ? pkg.overpayingAmount !== null
                    ? `~${formatDollars(pkg.overpayingAmount)} more than needed`
                    : "Oversold"
                  : "Limited coverage"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {recommended && (
        <div className="recommendation-block">
          <p className="recommendation-label">
            {VERDICT_ICON["good_fit"]} {recommended.name}
          </p>
          <p className="recommendation-reason">{recommended.verdictReason}</p>
        </div>
      )}

      {result.packages
        .filter((p) => p.verdict !== "good_fit" && p.id !== result.recommendedId)
        .map((pkg) => (
          <div key={pkg.id} className="verdict-detail">
            <span className="verdict-detail-name">{pkg.name}:</span>{" "}
            {pkg.verdictReason}
            {pkg.overpayingAmount !== null && pkg.overpayingAmount > 0 && (
              <span className="overpaying-callout">
                {" "}You may be overpaying by approximately {formatDollars(pkg.overpayingAmount)}.
              </span>
            )}
          </div>
        ))}

      <button className="print-btn" type="button" onClick={() => window.print()}>
        Print / Save as PDF
      </button>
    </div>
  );
}

export default function PackageResults({ result }: Props) {
  if (!result) {
    return (
      <div className="results-panel results-empty">
        <p>Fill in your event details to see your package analysis.</p>
      </div>
    );
  }

  if (result.mode === "single_evaluation" && result.packages[0]) {
    return <SingleEvaluation pkg={result.packages[0]} />;
  }

  return <ComparisonTable result={result} totalGuests={0} />;
}
