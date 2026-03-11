# Phase 0 Research: Deep Signal Puzzle Game

## Decision 1: Simulation Loop Timing Model
- Decision: Use `requestAnimationFrame` with a fixed simulation time-step accumulator and render interpolation.
- Rationale: This keeps movement/collision deterministic while maintaining smooth visuals across variable frame times.
- Alternatives considered:
  - Variable delta-time simulation: Simpler but introduces frame-rate-dependent gameplay behavior.
  - Render-only lockstep per frame: Leads to uneven simulation under dropped frames.

## Decision 2: Grid Logic With Smooth Rendering
- Decision: Keep gameplay state in grid coordinates and render with interpolated world coordinates.
- Rationale: Grid-based logic enforces predictable placement/collision; interpolation provides smooth player-facing motion without exposing the grid.
- Alternatives considered:
  - Fully continuous coordinates: Harder to keep collisions deterministic and fair.
  - Pure cell-jump rendering: Too visually rigid for intended movement feel.

## Decision 3: Light Attraction Arbitration
- Decision: Resolve competing light attraction by brightness first, then distance, with stable tie-breaking.
- Rationale: Matches gameplay intent and prevents steering jitter when multiple lights overlap.
- Alternatives considered:
  - Distance-only priority: Undermines brightness hierarchy and tactical choices.
  - Weighted random arbitration: Perceived as unfair and hard to reason about.

## Decision 4: Fair Random Visitor Scheduling
- Decision: Pre-compute event windows per level from seeded randomness, include explicit warning states before spawn, enforce shark/dolphin mutual exclusion.
- Rationale: Guarantees telegraphed threats and reproducible balancing while preserving replay variety.
- Alternatives considered:
  - Per-frame random checks: Can create abrupt, insufficiently telegraphed events.
  - Fully scripted visitors: Reduces variability and replayability.

## Decision 5: Persistence Contract
- Decision: Store progression in a namespaced, versioned localStorage payload (`deepSignal_v1`) with graceful fallback when storage is unavailable.
- Rationale: Supports save compatibility, schema evolution, and user clarity when progress cannot persist.
- Alternatives considered:
  - IndexedDB: Unnecessary complexity for small profile payloads.
  - No persistence: Conflicts with progression requirements.

## Decision 6: Static Hosting and Routing
- Decision: Include root `staticwebapp.config.json` with SPA fallback rewrite to `index.html` and explicit cache headers.
- Rationale: Ensures route resilience on Azure Static Web Apps and stable static asset performance.
- Alternatives considered:
  - Platform defaults only: Less explicit control and higher risk of routing/cache surprises.
  - Multiple HTML entry points: Increases maintenance complexity for a single-page game.

## Decision 7: Visual Readability Validation
- Decision: Define readability checks per entity class (silhouette, glow color identity, brightness contrast) as a required acceptance pass.
- Rationale: Ensures low-light recognizability goals are verifiable and consistent across levels.
- Alternatives considered:
  - Subjective review only: Inconsistent outcomes across iterations.
  - Texture-heavy sprites: Conflicts with primitive-drawn art direction and clarity constraints.

## Decision 8: Audio Handling Model
- Decision: Treat audio as optional enhancement only; all gameplay-critical feedback must have visual equivalents.
- Rationale: Satisfies silent-environment support and browser autoplay limitations without affecting playability.
- Alternatives considered:
  - Mandatory audio cues: Excludes silent play and violates requirements.
  - External audio assets only: Adds loading dependency and violates self-contained constraints.
