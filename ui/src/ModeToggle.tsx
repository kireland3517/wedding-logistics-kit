export type Mode = "venue" | "diy";

interface Props {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export default function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="mode-toggle">
      <button
        type="button"
        className={`mode-tab${mode === "venue" ? " mode-tab--active" : ""}`}
        onClick={() => onChange("venue")}
      >
        Venue Provides Bar
      </button>
      <button
        type="button"
        className={`mode-tab${mode === "diy" ? " mode-tab--active" : ""}`}
        onClick={() => onChange("diy")}
      >
        I&rsquo;m Buying Alcohol
      </button>
    </div>
  );
}
