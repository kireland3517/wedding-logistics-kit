import type { VibeLevel } from "@engine/types";

export interface SharedInputs {
  totalGuests: number;
  percentNonDrinkers: number;
  eventHours: number;
  startTime: string;
  vibeLevel: VibeLevel;
  earlyExitRate: number;
}

interface Props {
  inputs: SharedInputs;
  onChange: (next: SharedInputs) => void;
}

export default function SharedEventForm({ inputs, onChange }: Props) {
  function set<K extends keyof SharedInputs>(field: K, value: SharedInputs[K]) {
    onChange({ ...inputs, [field]: value });
  }

  return (
    <>
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
          <label>Crowd Vibe</label>
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
      </section>
    </>
  );
}
