import type { BarOutput } from "@engine/index";

interface Props {
  result: BarOutput | null;
}

const BUFFER_LABELS: Record<number, string> = {
  1.2: "On-site lodging — guests staying overnight",
  1.05: "Non-return state — conservative buffer applied",
  1.1: "Standard buffer",
};

function bufferLabel(multiplier: number): string {
  // Round to 2 decimal places to handle floating-point comparisons
  const key = Math.round(multiplier * 100) / 100;
  return BUFFER_LABELS[key] ?? `${multiplier}× buffer`;
}

export default function BarResults({ result }: Props) {
  if (!result) {
    return (
      <div className="results-panel results-empty">
        <p>Fill in all fields to see your quantities.</p>
      </div>
    );
  }

  const { totalServings, beerCases, wineBottles, spiritLiters, bufferMultiplier } = result;

  return (
    <div className="results-panel">
      <div className="results-header">
        <span className="results-label">Total Servings</span>
        <span className="results-total">{Math.ceil(totalServings)}</span>
      </div>

      <div className="results-grid">
        <div className="result-row">
          <div className="result-category">
            <span className="result-icon">Beer</span>
          </div>
          <div className="result-quantity">
            <span className="result-number">{beerCases}</span>
            <span className="result-unit">cases of 24</span>
          </div>
          <div className="result-cans">
            <span className="result-sub">{beerCases * 24} cans total</span>
          </div>
        </div>

        <div className="result-row">
          <div className="result-category">
            <span className="result-icon">Wine</span>
          </div>
          <div className="result-quantity">
            <span className="result-number">{wineBottles}</span>
            <span className="result-unit">bottles</span>
          </div>
          <div className="result-cans">
            <span className="result-sub">{wineBottles * 12} glasses est.</span>
          </div>
        </div>

        {spiritLiters > 0 && (
          <div className="result-row">
            <div className="result-category">
              <span className="result-icon">Spirits</span>
            </div>
            <div className="result-quantity">
              <span className="result-number">{spiritLiters}</span>
              <span className="result-unit">liters</span>
            </div>
            <div className="result-cans">
              <span className="result-sub">{spiritLiters * 20} shots est.</span>
            </div>
          </div>
        )}
      </div>

      <div className="buffer-note">
        <span className="buffer-badge">{bufferMultiplier}×</span>
        <span>{bufferLabel(bufferMultiplier)}</span>
      </div>

      <button
        className="print-btn"
        onClick={() => window.print()}
        type="button"
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
