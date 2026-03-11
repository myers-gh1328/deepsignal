# Quickstart: Deep Signal Puzzle Game

## Goal
Run and validate Deep Signal as a static-only browser game with no backend dependencies.

## Prerequisites
- Modern browser (latest Edge, Chrome, or Firefox)
- Local static server capability (any simple static file host)
- Repository contains:
  - `index.html`
  - `staticwebapp.config.json`

## 1) Launch Locally as Static Files
1. From repository root, serve files with a static server of your choice.
2. Open the served URL in browser.
3. Confirm the game loads directly into main menu without network/API dependency.

## 2) Validate Core Gameplay Loop
1. Start Level 1.
2. Place available light source near diver path.
3. Confirm diver steering is gradual toward light and resumes forward travel after passing.
4. Confirm diver save/loss outcomes update counters and end-of-level state.

### US1 MVP Scenario Checklist
- Confirm divers spawn one at a time from the left edge after spacing delay.
- Confirm wall collision and diver-vs-diver collision both trigger 180-degree turn.
- Confirm left edge return triggers 180-degree turn and cave re-entry.
- Confirm active light expires and inventory slot enters cooldown, then returns to ready.
- Confirm per-diver air bar drains over time and diver is lost at zero.
- Confirm airlock save increments saved counter and star preview updates live.

## 3) Validate Duration/Cooldown and HUD
1. Place each available creature.
2. Verify active timer visualization then cooldown in inventory tray.
3. Verify slot state transitions: ready -> active -> cooling -> ready.

## 4) Validate Hazards and Visitors
1. Run mid-level scenario with hazards enabled.
2. Verify eel/angler/swarm apply expected air penalties.
3. Verify shark warnings appear before spawn.
4. Verify shark and dolphin never overlap in active time.

### US2 Fairness Scenario Checklist
- Confirm shark warning quarter excludes quarter 1 (entrance zone).
- Confirm shark species gating by level range (bull, then hammerhead, then great white).
- Confirm shark contact causes diver turnback.
- Confirm dolphin appears less frequently than sharks and never in levels 1-2.
- Confirm dolphin collision carries diver two cells toward exit.
- Confirm no instant unavoidable hazard event occurs without warning phase.

## 5) Validate Persistence
1. Complete level and earn stars.
2. Reload page.
3. Confirm unlocked level and best stars persist.
4. If browser storage is unavailable, confirm non-blocking warning and gameplay continuity.

### US3 Progression Scenario Checklist
- Confirm level-complete panel appears when at least one diver is saved.
- Confirm level-failed panel appears when zero divers are saved.
- Confirm stars awarded: 3 (all), 2 (most), 1 (at least one), 0 (none).
- Confirm level select shows locked levels dimmed and completed levels with best stars.
- Confirm main menu reflects cumulative star total and unlocked level progress.

## 6) Validate Constitution-Critical Constraints
- No backend/API calls required for gameplay.
- Internal grid never visible.
- Entity silhouette and glow identities remain distinguishable in dark scenes.
- Optional audio does not block play when disabled/unavailable.

## 7) Azure Static Web Apps Readiness Check
- Confirm `staticwebapp.config.json` exists at repo root.
- Confirm SPA fallback routes resolve to `index.html`.
- Confirm static asset cache policy is defined as intended.

## 8) Final End-to-End Runbook
1. Start from main menu and run Level 1 to completion.
2. Run a mid-level (>= 5) to validate angler/swarm and random visitors.
3. Intentionally fail one level to confirm retry flow and failure panel.
4. Open level select, launch an unlocked level, and verify best-star persistence.
5. Reload the page and verify progression and stars are restored.
6. Validate no visible grid lines in any screen state.
7. Validate game remains playable with browser audio blocked or muted.
