import { useState, useMemo } from "react";
import { calculateBar, calculatePackages, ValidationError } from "@engine/index";
import type { BarOutput, PackageOutput, VenuePackage } from "@engine/index";
import ModeToggle, { type Mode } from "./ModeToggle";
import SharedEventForm, { type SharedInputs } from "./SharedEventForm";
import DiyBarForm, { type DiyInputs } from "./DiyBarForm";
import BarResults from "./BarResults";
import PackageForm from "./PackageForm";
import PackageResults from "./PackageResults";

// ─── Default State ────────────────────────────────────────────────────────────

const SHARED_DEFAULTS: SharedInputs = {
  totalGuests: 100,
  percentNonDrinkers: 0.2,
  eventHours: 5,
  startTime: "17:00",
  vibeLevel: "standard",
  earlyExitRate: 0.1,
};

const DIY_DEFAULTS: DiyInputs = {
  state: "Texas",
  onSiteLodging: false,
  barType: "full",
  serviceStyle: "bartender",
};

const PACKAGE_DEFAULTS: VenuePackage[] = [
  { id: "pkg-1", name: "Beer & Wine", tier: "beer_wine", pricePerPerson: 18 },
  { id: "pkg-2", name: "Full Bar", tier: "full", pricePerPerson: 28 },
  { id: "pkg-3", name: "Premium Open Bar", tier: "premium_spirits", pricePerPerson: 38 },
];

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState<Mode>("venue");
  const [shared, setShared] = useState<SharedInputs>(SHARED_DEFAULTS);
  const [diy, setDiy] = useState<DiyInputs>(DIY_DEFAULTS);
  const [packages, setPackages] = useState<VenuePackage[]>(PACKAGE_DEFAULTS);

  const barResult: BarOutput | null = useMemo(() => {
    if (mode !== "diy") return null;
    try {
      return calculateBar({ ...shared, ...diy });
    } catch (e) {
      if (e instanceof ValidationError) return null;
      throw e;
    }
  }, [mode, shared, diy]);

  const packageResult: PackageOutput | null = useMemo(() => {
    if (mode !== "venue") return null;
    try {
      return calculatePackages({ ...shared, packages });
    } catch (e) {
      if (e instanceof ValidationError) return null;
      throw e;
    }
  }, [mode, shared, packages]);

  return (
    <div className="layout">
      <header className="site-header">
        <div className="header-inner">
          <p className="eyebrow">DIY Wedding Logistics Kit</p>
          <h1>Bar Edition Calculator</h1>
          <p className="subhead">
            Fill in your event details — results update instantly as you go.
          </p>
        </div>
      </header>

      <div className="mode-bar">
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      <div className="content">
        <form className="bar-form" onSubmit={(e) => e.preventDefault()}>
          <SharedEventForm inputs={shared} onChange={setShared} />
          {mode === "diy" && <DiyBarForm inputs={diy} onChange={setDiy} />}
          {mode === "venue" && <PackageForm packages={packages} onChange={setPackages} />}
        </form>

        {mode === "diy"
          ? <BarResults result={barResult} />
          : <PackageResults result={packageResult} />
        }
      </div>

      <footer className="site-footer">
        <p>Results include a safety buffer. Always round up when ordering.</p>
      </footer>
    </div>
  );
}
