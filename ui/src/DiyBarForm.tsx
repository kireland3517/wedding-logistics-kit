import type { BarType, ServiceStyle } from "@engine/types";

export interface DiyInputs {
  state: string;
  onSiteLodging: boolean;
  barType: BarType;
  serviceStyle: ServiceStyle;
}

interface Props {
  inputs: DiyInputs;
  onChange: (next: DiyInputs) => void;
}

export default function DiyBarForm({ inputs, onChange }: Props) {
  function set<K extends keyof DiyInputs>(field: K, value: DiyInputs[K]) {
    onChange({ ...inputs, [field]: value });
  }

  return (
    <section className="form-section">
      <h2 className="section-title">Bar Setup</h2>

      <div className="field">
        <label htmlFor="state">State</label>
        <input
          id="state"
          type="text"
          placeholder="e.g. Texas"
          value={inputs.state}
          onChange={(e) => set("state", e.target.value)}
        />
      </div>

      <div className="field field-checkbox">
        <label htmlFor="onSiteLodging">
          <input
            id="onSiteLodging"
            type="checkbox"
            checked={inputs.onSiteLodging}
            onChange={(e) => set("onSiteLodging", e.target.checked)}
          />
          Guests staying on-site overnight
        </label>
      </div>

      <div className="field">
        <label>Bar Type</label>
        <div className="radio-group">
          {([
            ["full", "Full Bar"],
            ["beer_wine", "Beer & Wine"],
            ["limited_spirits", "Limited Spirits"],
          ] as [BarType, string][]).map(([v, label]) => (
            <label key={v} className="radio-option">
              <input
                type="radio"
                name="barType"
                value={v}
                checked={inputs.barType === v}
                onChange={() => set("barType", v)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Service Style</label>
        <div className="radio-group">
          {([
            ["bartender", "Bartender (5 pours/bottle)"],
            ["self_pour", "Self Pour (4 pours/bottle)"],
          ] as [ServiceStyle, string][]).map(([v, label]) => (
            <label key={v} className="radio-option">
              <input
                type="radio"
                name="serviceStyle"
                value={v}
                checked={inputs.serviceStyle === v}
                onChange={() => set("serviceStyle", v)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
