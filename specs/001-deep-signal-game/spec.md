# Feature Specification: Deep Signal Puzzle Game

**Feature Branch**: `001-deep-signal-game`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "Build Deep Signal — a client-side browser puzzle game deployed on Azure Static Web App."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guide Divers With Bioluminescent Placement (Priority: P1)

As a player, I can place sea-creature light sources to influence automatically moving
divers through a dark cave and save them at the airlock exit.

**Why this priority**: This is the core game promise and provides the minimum playable
value.

**Independent Test**: Can be fully tested by running level 1 and confirming that diver
movement, light attraction, air depletion, save/loss outcomes, and placement duration/
cooldown behavior all function without any advanced hazards.

**Acceptance Scenarios**:

1. **Given** a level with one diver and available inventory, **When** the player places a
  light source within range, **Then** the diver gradually steers toward the brightest
  effective nearby light and resumes straight-line movement after passing it.
2. **Given** a placed creature with active duration and cooldown, **When** its active time
  ends, **Then** it is removed from the cave and returns to inventory only after cooldown
  completion.
3. **Given** a diver with an air gauge, **When** air reaches zero before reaching the
  airlock, **Then** that diver is marked lost and excluded from saved-count totals.
4. **Given** a diver reaching the airlock, **When** the diver enters the exit zone,
  **Then** the diver is marked saved and the saved counter updates.

---

### User Story 2 - Navigate Fair Hazards and Random Visitors (Priority: P2)

As a player, I can respond to hazards and random visitors that add challenge without
creating unavoidable failures.

**Why this priority**: Hazard fairness and readability are essential to make difficulty
feel skill-based rather than random punishment.

**Independent Test**: Can be tested in a mid-level setup containing electric eel,
anglerfish, swarm, and random shark/dolphin events, verifying warnings, collision
effects, and mutual-exclusion rules.

**Acceptance Scenarios**:

1. **Given** a shark event is selected, **When** a shark is about to enter, **Then** its
  target map quarter is warned visually before the shark appears.
2. **Given** a dolphin event is selected, **When** a diver collides with the dolphin,
  **Then** the diver is carried two grid spaces toward the exit and released.
3. **Given** a shark is active, **When** a dolphin event window is reached, **Then** the
  dolphin does not spawn simultaneously with the shark.
4. **Given** a diver contacts eel, anglerfish, or swarm hazard zones, **When** contact
  occurs, **Then** air loss is applied according to hazard severity while movement rules
  still remain deterministic.

---

### User Story 3 - Progress Across Levels and Preserve Results (Priority: P3)

As a player, I can move through level progression, view star outcomes, retry failures,
and return later with progress preserved.

**Why this priority**: Progression and persistence are required for long-term engagement
and replayability.

**Independent Test**: Can be tested by completing and failing multiple levels, checking
unlock behavior, star ratings, menu/state transitions, and reload persistence.

**Acceptance Scenarios**:

1. **Given** a level ends, **When** saved diver count is evaluated, **Then** the player is
  awarded 1-3 stars based on defined scoring bands.
2. **Given** a level fails with zero saved divers, **When** results are shown, **Then**
  retry is required before progression.
3. **Given** at least one completed level, **When** the player returns to level select,
  **Then** best star ratings are shown and locked levels are visibly distinct.
4. **Given** saved progress exists, **When** the player refreshes or reopens the game,
  **Then** unlocked levels and best stars are restored.

---

### Edge Cases

- If persistent browser storage is unavailable, gameplay remains fully functional for the current
  session and the player is clearly informed that progress cannot be saved.
- If the tab is backgrounded or frame timing spikes, movement and timers resume without
  large unfair jumps that instantly lose divers.
- If two divers collide repeatedly in tight spaces, deterministic 180-degree turn rules
  prevent overlap-lock and keep motion predictable.
- If multiple lights compete, tie-breaking remains stable (brightness first, then
  proximity) to avoid erratic steering flicker.
- If a shark warning triggers near a diver, warning lead time is still long enough for at
  least one meaningful player response.
- If audio cannot play due to autoplay policies, all gameplay cues remain available via
  visual signals.
- If a diver reaches the left edge, the diver turns and re-enters cave flow instead of
  leaving play permanently.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST be deployable as static files to Azure Static Web Apps.
- **FR-002**: The game MUST operate entirely client-side with no backend services and no
  required API routes.
- **FR-003**: A static hosting route configuration file MUST be included at repository root to support
  root SPA fallback behavior.
- **FR-004**: The game MUST present all visuals and interactions directly in-browser with
  no platform installation requirements.
- **FR-005**: The playable build MUST be self-contained and must not depend on external
  package managers, build pipelines, or CDN imports.
- **FR-006**: Divers MUST spawn from the left edge one at a time with configured spacing
  based on prior diver progress distance.
- **FR-007**: Divers MUST move continuously at level-defined constant speed, initially in a
  straight line until redirected.
- **FR-008**: Diver collision behaviors MUST match defined rules for walls, other divers,
  map edge, hazards, and random visitors.
- **FR-009**: Each diver MUST have an individual air gauge that continuously depletes and
  can be reduced by specific hazard interactions.
- **FR-010**: Divers MUST be marked lost immediately when air reaches zero.
- **FR-011**: Divers MUST be marked saved when they reach the airlock exit.
- **FR-012**: The airlock exit light influence MUST be strongest among all light sources.
- **FR-013**: Player-placed creatures MUST occupy one grid cell, have active duration,
  expire, and then return to inventory only after cooldown.
- **FR-014**: The HUD inventory tray MUST clearly indicate ready, active-on-map, and
  cooldown states for each creature type.
- **FR-015**: Light steering MUST be gradual, not instant, and MUST select attraction
  target by brightness then proximity when multiple lights compete.
- **FR-016**: Electric eel, anglerfish, and swarm hazards MUST be level-placed and
  non-player-controlled.
- **FR-017**: Shark visitors MUST follow level-based spawn probabilities, allowed species,
  max concurrent counts, and warning behavior by level range.
- **FR-018**: Shark spawn zones MUST exclude the entrance quarter and be chosen per event.
- **FR-019**: Dolphin visitor frequency MUST remain lower than sharks, MUST not appear in
  levels 1-2, and MUST never overlap in time with shark presence.
- **FR-020**: Dolphin collision MUST carry divers two grid spaces toward exit before
  release.
- **FR-021**: Level progression MUST enforce configured diver counts and unlock sequences.
- **FR-022**: Inventory availability by level range MUST follow the defined rollout of
  creature types and quantities.
- **FR-023**: End-of-level star outcomes MUST follow defined scoring bands and require
  retry after zero saves.
- **FR-024**: Game states MUST include main menu, playing, level complete, level failed,
  and level select with expected controls and status displays.
- **FR-025**: Best star results and progression state MUST persist across sessions using
  local browser storage when available.
- **FR-026**: The internal grid MUST govern placement and movement alignment while never
  being visually rendered to players.
- **FR-027**: Visual style MUST preserve deep-ocean readability with distinct silhouette
  and glow identity for each entity type.
- **FR-028**: Audio, if present, MUST be optional, generated at runtime, and never block
  or alter gameplay outcomes when unavailable.

### Key Entities *(include if feature involves data)*

- **Diver**: A rescue target with position, heading, speed, air value, status
  (`active/saved/lost`), and level-specific behavior modifiers.
- **Light Source Type**: A player-available creature definition including brightness tier,
  attraction strength, active duration, cooldown, and visual identity.
- **Placed Light Source**: An in-level instance of a light source type with cell location,
  remaining active time, and owner inventory linkage.
- **Hazard**: A level-defined environmental threat with movement profile, influence zone,
  and air-loss effect severity.
- **Visitor Event**: A time-scoped shark or dolphin occurrence with spawn constraints,
  warning state, occupancy zone, and collision effect.
- **Level Definition**: Per-level configuration including cave layout, diver count,
  inventory limits, hazards, visitor behavior ranges, and air depletion pace.
- **Run Result**: End-of-level outcome containing saved count, lost count, star rating,
  and retry/progression eligibility.
- **Progress Profile**: Persisted player data containing unlocked level index and best star
  rating per level.

## Assumptions

- Initial release targets desktop and modern mobile browsers with support for smooth
  animation timing and local persistence.
- Level numbering starts at 1 and progression is strictly sequential unless a level has
  been unlocked previously.
- "Most divers saved" for 2-star rating means at least half of divers in that level are
  saved, rounded up when odd.
- Visitor warning visuals are sufficient to satisfy fairness even if optional audio is
  disabled.

## Dependencies

- Browser support for core gameplay runtime capabilities (real-time animation and
  persistent local progress storage).
- Azure Static Web Apps static hosting behavior with root fallback configured by
  the repository root route configuration file.
- Level content definitions for cave layouts, hazard placement, and unlock progression.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In internal playtests across at least 10 full runs on target devices, at
  least 90% of gameplay time appears smooth to players without sustained visible stutter.
- **SC-002**: At least 95% of first-time test players can correctly identify every light
  source and hazard type from silhouette plus glow color within 3 seconds per prompt.
- **SC-003**: At least 90% of shark appearances provide enough warning for players to make
  at least one meaningful placement or repositioning decision before contact risk.
- **SC-004**: At least 90% of first-time players complete levels 1-2 with at least one
  diver saved, demonstrating learnability through play.
- **SC-005**: In 100 consecutive progression tests, saved stars and unlocked levels are
  restored correctly after reload whenever browser storage is available.
- **SC-006**: 100% of validation checks confirm no visible grid lines/cell overlays are
  present during gameplay across all game states.
