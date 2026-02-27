import { useState, useMemo } from "react";
import { calculateBar, ValidationError } from "@engine/index";
import type { BarOutput } from "@engine/index";
import type { VibeLevel, BarType, ServiceStyle } from "@engine/types";
import BarForm from "./BarForm";
import BarResults from "./BarResults";

export interface FormInputs {
  totalGuests: number;
  percentNonDrinkers: number;
  eventHours: number;
  startTime: string;
  vibeLevel: VibeLevel;
  earlyExitRate: number;
  state: string;
  onSiteLodging: boolean;
  barType: BarType;
  serviceStyle: ServiceStyle;
}

const DEFAULTS: FormInputs = {
  totalGuests: 100,
  percentNonDrinkers: 0.2,
  eventHours: 5,
  startTime: "17:00",
  vibeLevel: "standard",
  earlyExitRate: 0.1,
  state: "Texas",
  onSiteLodging: false,
  barType: "full",
  serviceStyle: "bartender",
};

export default function App() {
  const [inputs, setInputs] = useState<FormInputs>(DEFAULTS);

  const result: BarOutput | null = useMemo(() => {
    try {
      return calculateBar(inputs);
    } catch (e) {
      if (e instanceof ValidationError) return null;
      throw e;
    }
  }, [inputs]);

  return (
    <div className="layout">
      <header className="site-header">
        <div className="header-inner">
          <p className="eyebrow">DIY Wedding Logistics Kit</p>
          <h1>Bar Edition Calculator</h1>
          <p className="subhead">
            Fill in your event details — quantities update instantly as you go.
          </p>
        </div>
      </header>

      <div className="content">
        <BarForm inputs={inputs} onChange={setInputs} />
        <BarResults result={result} />
      </div>

      <footer className="site-footer">
        <p>Results include a safety buffer. Always round up when ordering.</p>
      </footer>
    </div>
  );
}
