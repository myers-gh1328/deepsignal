# Contract: Deep Signal Runtime and Persistence

## Purpose
Define externally-relevant contracts for game behavior, persistence, and static hosting expectations.

## 1) Runtime State Contract
The runtime exposes these player-visible state transitions:
- `mainMenu -> playing` via Play action
- `playing -> levelComplete` when level resolves with at least one saved diver
- `playing -> levelFailed` when level resolves with zero saved divers
- `levelComplete -> playing` via next level action
- `levelFailed -> playing` via retry action
- `mainMenu <-> levelSelect` via menu navigation

Conformance requirements:
- State transitions must be deterministic and recoverable on refresh using persisted progress when available.
- UI labels (level index, saved counter, star preview, inventory cooldown) must reflect underlying state in the same frame update cycle.

## 2) Persistence Contract (localStorage)
Storage key:
- `deepSignal_v1`

Payload shape:
```json
{
  "schemaVersion": 1,
  "maxUnlockedLevel": 1,
  "bestStarsByLevel": {
    "1": 3
  },
  "lastUpdatedUtc": "2026-03-10T00:00:00.000Z"
}
```

Validation rules:
- `schemaVersion` must be numeric.
- `maxUnlockedLevel` must be >= 1.
- `bestStarsByLevel[level]` values must be integers 0-3.
- Invalid payloads are ignored and replaced with safe defaults.

Fallback behavior:
- If storage APIs are unavailable or write fails, gameplay continues for current session.
- User receives visible non-blocking notice that progress cannot be saved.

## 3) Static Hosting Contract (Azure Static Web Apps)
Required root file:
- `staticwebapp.config.json`

Required behaviors:
- Non-file routes resolve to `index.html` (single-page experience).
- No API routes are required or referenced.
- Static assets are cacheable with explicit headers; entry HTML remains refreshable for updates.

## 4) Gameplay Fairness Contract
Random visitors and hazards must satisfy:
- Shark events include visible warning period before appearance.
- Dolphin and shark are mutually exclusive in active window overlap.
- Entrance quarter is excluded from shark zones.
- Hazard effects are consistent and predictable by type.

## 5) Visual Legibility Contract
Each entity class must maintain:
- Distinct silhouette shape
- Distinct glow color family
- Readable contrast against dark background
- Invisible internal grid (never rendered)
