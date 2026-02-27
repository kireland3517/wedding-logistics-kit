import type { FormInputs } from "./App";
import type { VibeLevel, BarType, ServiceStyle } from "@engine/types";

interface Props {
  inputs: FormInputs;
  onChange: (next: FormInputs) => void;
}

export default function BarForm({ inputs, onChange }: Props) {
  function set<K extends keyof FormInputs>(field: K, value: FormInputs[K]) {
    onChange({ ...inputs, [field]: value });
  }

  return (
    <form className="bar-form" onSubmit={(e) => e.preventDefault()}>
      <section className="form-section">
        <h2 className="section-title">Guest Details</h2>

        <div className="field">
          <label htmlFor="totalGuests">Total Guests</label>
          <input
            id="totalGuests"
            type="number"
            min="1"
            step="1"
            value={inputs.totalGuests}
            onChange={(e) => set("totalGuests", Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>

        <div className="field">
          <label htmlFor="percentNonDrinkers">
            Non-Drinkers
            <span className="field-value">{Math.round(inputs.percentNonDrinkers * 100)}%</span>
          </label>
          <input
            id="percentNonDrinkers"
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(inputs.percentNonDrinkers * 100)}
            onChange={(e) => set("percentNonDrinkers", parseInt(e.target.value) / 100)}
          />
          <div className="range-labels"><span>0%</span><span>100%</span></div>
        </div>

        <div className="field">
          <label htmlFor="earlyExitRate">
            Guests Leaving Early
            <span className="field-value">{Math.round(inputs.earlyExitRate * 100)}%</span>
          </label>
          <input
            id="earlyExitRate"
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(inputs.earlyExitRate * 100)}
            onChange={(e) => set("earlyExitRate", parseInt(e.target.value) / 100)}
          />
          <div className="range-labels"><span>0%</span><span>100%</span></div>
        </div>
      </section>

      <section className="form-section">
        <h2 className="section-title">Event Details</h2>

        <div className="field">
          <label htmlFor="eventHours">Duration (hours)</label>
          <input
            id="eventHours"
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            value={inputs.eventHours}
            onChange={(e) => set("eventHours", Math.max(0.5, parseFloat(e.target.value) || 0.5))}
          />
        </div>

        <div className="field">
          <label htmlFor="startTime">Start Time</label>
          <input
            id="startTime"
            type="time"
            value={inputs.startTime}
            onChange={(e) => set("startTime", e.target.value)}
          />
        </div>

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
      </section>

      <section className="form-section">
        <h2 className="section-title">Bar Setup</h2>

        <div className="field">
          <label>Vibe</label>
          <div className="radio-group">
            {(["conservative", "standard", "party"] as VibeLevel[]).map((v) => (
              <label key={v} className="radio-option">
                <input
                  type="radio"
                  name="vibeLevel"
                  value={v}
                  checked={inputs.vibeLevel === v}
                  onChange={() => set("vibeLevel", v)}
                />
                <span>{v.charAt(0).toUpperCase() + v.slice(1)}</span>
              </label>
            ))}
          </div>
          <p className="field-hint">Conservative = 1 drink/hr · Standard = 1.5 · Party = 2</p>
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
    </form>
  );
}
