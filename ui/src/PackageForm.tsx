import type { VenuePackage, PackageTier } from "@engine/types";

interface Props {
  packages: VenuePackage[];
  onChange: (packages: VenuePackage[]) => void;
}

const TIER_LABELS: Record<PackageTier, string> = {
  beer_wine: "Beer & Wine",
  full: "Full Bar",
  premium_spirits: "Premium Spirits",
};

export default function PackageForm({ packages, onChange }: Props) {
  function updatePackage(id: string, field: keyof VenuePackage, value: string | number) {
    onChange(packages.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function addPackage() {
    const id = `pkg-${Date.now()}`;
    onChange([...packages, { id, name: "New Package", tier: "full", pricePerPerson: 0 }]);
  }

  function removePackage(id: string) {
    if (packages.length <= 1) return; // always keep at least one
    onChange(packages.filter((p) => p.id !== id));
  }

  return (
    <section className="form-section">
      <h2 className="section-title">Venue Packages</h2>
      <p className="field-hint" style={{ marginBottom: "1rem" }}>
        Enter your venue's bar packages. Replace the pre-filled prices with your actual quotes.
      </p>

      <div className="package-list">
        {packages.map((pkg) => (
          <div key={pkg.id} className="package-row">
            <div className="package-row-fields">
              <div className="field field--inline">
                <label htmlFor={`name-${pkg.id}`}>Package name</label>
                <input
                  id={`name-${pkg.id}`}
                  type="text"
                  value={pkg.name}
                  onChange={(e) => updatePackage(pkg.id, "name", e.target.value)}
                />
              </div>

              <div className="field field--inline">
                <label>Type</label>
                <div className="radio-group radio-group--horizontal">
                  {(["beer_wine", "full", "premium_spirits"] as PackageTier[]).map((t) => (
                    <label key={t} className="radio-option">
                      <input
                        type="radio"
                        name={`tier-${pkg.id}`}
                        value={t}
                        checked={pkg.tier === t}
                        onChange={() => updatePackage(pkg.id, "tier", t)}
                      />
                      <span>{TIER_LABELS[t]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="field field--inline field--price">
                <label htmlFor={`price-${pkg.id}`}>$/person</label>
                <div className="price-input">
                  <span className="price-symbol">$</span>
                  <input
                    id={`price-${pkg.id}`}
                    type="number"
                    min="0"
                    step="1"
                    value={pkg.pricePerPerson}
                    onChange={(e) =>
                      updatePackage(pkg.id, "pricePerPerson", Math.max(0, parseFloat(e.target.value) || 0))
                    }
                  />
                </div>
              </div>
            </div>

            {packages.length > 1 && (
              <button
                type="button"
                className="remove-package-btn"
                onClick={() => removePackage(pkg.id)}
                aria-label={`Remove ${pkg.name}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {packages.length < 5 && (
        <button type="button" className="add-package-btn" onClick={addPackage}>
          + Add package
        </button>
      )}
    </section>
  );
}
