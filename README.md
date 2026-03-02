# DIY Wedding Logistics Kit — Bar Edition

A self-contained bar planning calculator for weddings. Opens in any browser with no install, no account, and no internet connection after download.

---

## What it does

Two modes, one file:

### Venue Provides Bar
Enter your venue's bar package options and your crowd profile. The calculator tells you:
- Which package actually fits your crowd's drink preferences
- Which packages you'd be overpaying for and by how much
- A specific, plain-language explanation for every verdict — not generic labels

### I'm Buying Alcohol
Enter your guest count, event details, and crowd vibe. The calculator outputs:
- How many beer cases, wine bottles, and liters of spirits to buy
- A safety buffer based on your state's return policy and whether guests are staying on-site
- All quantities in purchasable units (cases, standard bottles, liters)

Results update instantly as you change any input. No submit button.

---

## How to use the download

1. Open `dist/index.html` in any browser
2. Fill in your event details
3. Switch between modes with the tabs at the top
4. Use **Print / Save as PDF** to save your results

That's it. The file works offline and requires nothing else.

---

## Project structure

```
wedding-logistics-kit/
├── src/engine/          # Pure TypeScript logic — no UI dependencies
│   ├── types.ts         # All types + input validation
│   ├── consumption.ts   # Crowd consumption model (shared by both modes)
│   ├── buffer.ts        # Safety buffer logic (DIY mode only)
│   ├── allocation.ts    # Beer/wine/spirits split + unit conversion (DIY mode only)
│   ├── packages.ts      # Venue package coverage + verdict engine (Venue mode only)
│   └── index.ts         # Public API surface
├── tests/
│   └── bar.test.ts      # 32 unit tests
├── ui/                  # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx              # Root — mode toggle + split state
│   │   ├── ModeToggle.tsx       # Tab switcher
│   │   ├── SharedEventForm.tsx  # Inputs shared by both modes
│   │   ├── DiyBarForm.tsx       # DIY-only inputs
│   │   ├── PackageForm.tsx      # Venue package entry (1–5 packages)
│   │   ├── BarResults.tsx       # DIY shopping list output
│   │   ├── PackageResults.tsx   # Package comparison table / single eval
│   │   └── index.css
│   ├── dist/
│   │   └── index.html           # The distributable — fully self-contained
│   └── vite.config.ts
└── package.json
```

---

## Venue package analysis — how it works

The calculator does not infer drink quantities from price. Venue pricing varies too much by market to make that meaningful. Instead it estimates the fraction of your crowd's drinks that would be spirits, based on crowd vibe:

| Crowd vibe | Estimated spirits fraction |
|------------|---------------------------|
| Conservative | ~10% |
| Standard | ~25% |
| Party | ~35% |

A Beer & Wine package covers the non-spirits portion of expected drinks. Full Bar and Premium Spirits cover 100%.

**Coverage threshold:** a package needs to cover ≥85% of expected drink types to qualify as a good fit.

**Verdicts:**
- `Good Fit` — this package covers your crowd's drink preferences
- `Oversold` — a cheaper package would serve your crowd equally well; shows dollar figure overage
- `Limited Coverage` — beer and wine only won't fully satisfy this crowd's expected spirits demand

If you enter only one package (because your venue doesn't offer a choice), the calculator evaluates it in isolation with no comparison.

---

## DIY bar calculation — how it works

```
drinking guests  =  total guests × (1 − non-drinkers %)
vibe multiplier  =  base rate (1.0 / 1.5 / 2.0) + time-of-day adjustment
baseline         =  drinking guests × hours × vibe multiplier
surge            =  drinking guests × rush multiplier (based on event duration)
early exit       =  drinking guests × early exit rate × vibe multiplier
raw servings     =  max(0, baseline + surge − early exit)
final servings   =  raw servings × buffer multiplier
```

**Buffer priority (non-stacking):** on-site lodging (1.25×) > non-return state (1.20×) > default (1.15×)

**Drink split defaults:** Beer 40% · Wine 35% · Spirits 25% (adjusted for bar type)

**Units:** Beer → cases of 24 · Wine → 750 mL bottles · Spirits → liters

---

## Development

**Prerequisites:** Node.js 18+

### Engine (TypeScript + Vitest)

```bash
# From repo root
npm install
npm test           # run 32 unit tests
npm run typecheck  # TypeScript strict check, no emit
npm run build      # compile to dist/
```

### UI (React + Vite)

```bash
cd ui
npm install
npm run dev        # local dev server at localhost:5173
npm run build      # produces ui/dist/index.html (single self-contained file)
```

The UI imports the engine source directly via the `@engine` path alias — no separate engine build step needed for UI development.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Engine | TypeScript 5, strict mode |
| Tests | Vitest |
| UI | React 19, Vite 7 |
| Distribution | `vite-plugin-singlefile` — inlines all JS/CSS into one HTML file |
