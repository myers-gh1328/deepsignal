# Tasks: Deep Signal Puzzle Game

**Input**: Design documents from `/specs/001-deep-signal-game/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No automated test framework is mandated in the specification; this task list uses manual validation tasks from `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Static web game project: `index.html`, `staticwebapp.config.json`, `assets/`
- Feature docs: `specs/001-deep-signal-game/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize static hosting shell and base page structure

- [X] T001 [P] Create Azure Static Web Apps routing and cache configuration in `staticwebapp.config.json`
- [X] T002 [P] Create single-page HTML/CSS/Canvas shell with menu and HUD containers in `index.html`
- [X] T003 Define centralized gameplay constants block (durations, speeds, brightness, level ranges) at top of `index.html`
- [X] T004 Define top-level single `gameState` object and initial mode bootstrapping in `index.html`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core runtime systems required before any user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Implement fixed-step simulation loop with `requestAnimationFrame` and interpolation timing in `index.html`
- [X] T006 Implement invisible grid model and grid-to-render coordinate helpers in `index.html`
- [X] T007 Implement base entity factories/types (Diver, Light, Hazard, Visitor, Level, Result) in `index.html`
- [X] T008 Implement deterministic collision/rule dispatcher for walls, edges, and entity interactions in `index.html`
- [X] T009 Implement level definition loader for diver counts, inventory rollout, hazards, and visitor rule bands in `index.html`
- [X] T010 Implement runtime mode state machine (mainMenu, playing, levelComplete, levelFailed, levelSelect) in `index.html`
- [X] T011 Implement persistence adapter for `deepSignal_v1` schema validation and fallback-notice behavior in `index.html`
- [X] T012 Implement shared HUD render pipeline for level label, saved counter, star preview, and storage warning in `index.html`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Guide Divers With Bioluminescent Placement (Priority: P1) 🎯 MVP

**Goal**: Player can place light creatures to steer divers and rescue them at the airlock

**Independent Test**: Run level 1 and verify placement, attraction steering, air depletion, save/loss outcomes, and cooldown return behavior

### Implementation for User Story 1

- [X] T013 [US1] Implement diver spawn cadence from left edge with spacing based on prior diver progress in `index.html`
- [X] T014 [US1] Implement diver straight-line movement, 180-degree turn rules, and left-edge re-entry in `index.html`
- [X] T015 [US1] Implement placeable creature catalog (five types) with brightness hierarchy and inventory quantities in `index.html`
- [X] T016 [US1] Implement pointer placement snapping to invisible grid and placement validity checks in `index.html`
- [X] T017 [US1] Implement light attraction arbitration (brightness first, then proximity) with gradual steering in `index.html`
- [X] T018 [US1] Implement diver air depletion over time and per-diver air gauge rendering in `index.html`
- [X] T019 [US1] Implement light active duration expiry and cooldown-based inventory return in `index.html`
- [X] T020 [US1] Implement airlock save detection and run outcome counters for saved/lost divers in `index.html`
- [X] T021 [US1] Implement low-light visual identities for diver, cave, airlock, and five player light types in `index.html`
- [X] T022 [US1] Add manual MVP validation checklist steps and expected outcomes for level 1 in `specs/001-deep-signal-game/quickstart.md`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Navigate Fair Hazards and Random Visitors (Priority: P2)

**Goal**: Player can react to hazards and visitors with telegraphed, avoidable difficulty

**Independent Test**: Run mid-level scenario and verify hazard effects, shark warnings, shark/dolphin mutual exclusion, and deterministic outcomes

### Implementation for User Story 2

- [X] T023 [US2] Implement electric eel patrol behavior, dim lure influence, and air-drain contact effects in `index.html`
- [X] T024 [US2] Implement stationary anglerfish lure/body harm zones and mid/late-level availability in `index.html`
- [X] T025 [US2] Implement drifting siphonophore swarm soft-barrier behavior and air-drain effect in `index.html`
- [X] T026 [US2] Implement shark event scheduler by level probability/species/max-count rules in `index.html`
- [X] T027 [US2] Implement shark warning phase with quarter pre-indication excluding entrance quarter in `index.html`
- [X] T028 [US2] Implement shark species movement patterns (bull erratic, hammerhead sweep, great white patrol) in `index.html`
- [X] T029 [US2] Implement dolphin event scheduler with lower frequency, level gating, and shark mutual-exclusion lockout in `index.html`
- [X] T030 [US2] Implement dolphin carry effect (two grid spaces toward exit) and release behavior in `index.html`
- [X] T031 [US2] Implement fairness tuning controls for warning lead time and event cooldown windows in `index.html`
- [X] T032 [P] [US2] Add manual hazard/visitor validation scenarios and fairness checks in `specs/001-deep-signal-game/quickstart.md`

**Checkpoint**: User Stories 1 and 2 both work independently with fair hazard gameplay

---

## Phase 5: User Story 3 - Progress Across Levels and Preserve Results (Priority: P3)

**Goal**: Player can progress through levels, receive star ratings, and keep results across sessions

**Independent Test**: Complete and fail levels, then reload and verify unlock state and best stars are restored

### Implementation for User Story 3

- [X] T033 [US3] Implement star rating resolution rules (3-star perfect, 2-star most saved, 1-star survived, 0-star retry) in `index.html`
- [X] T034 [US3] Implement level-complete and level-failed result screens with next/retry actions in `index.html`
- [X] T035 [US3] Implement level-select view with locked-level dimming and per-level best star display in `index.html`
- [X] T036 [US3] Implement progression unlock logic and high-score summary display on main menu in `index.html`
- [X] T037 [US3] Implement save/load integration to persist and restore progression profile across reloads in `index.html`
- [X] T038 [US3] Implement live HUD star preview updates during level play in `index.html`
- [X] T039 [US3] Add manual progression and persistence validation scenarios in `specs/001-deep-signal-game/quickstart.md`

**Checkpoint**: All user stories are independently functional with persistent progression

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality improvements affecting multiple stories

- [X] T040 Refine visual readability and glow contrast for all entities in dark scenes in `index.html`
- [X] T041 Profile and tune frame pacing/performance hotspots for smooth 60fps perception in `index.html`
- [X] T042 Verify no internal grid artifacts are rendered in any game state in `index.html`
- [X] T043 Verify static hosting behavior, route fallback, and cache headers in `staticwebapp.config.json`
- [X] T044 [P] Finalize end-to-end validation runbook aligned with completed implementation in `specs/001-deep-signal-game/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Stories (Phases 3-5)**: Depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on completion of targeted user stories

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational phase; no dependency on US2/US3
- **User Story 2 (P2)**: Starts after Foundational phase and can proceed independently of US3
- **User Story 3 (P3)**: Starts after Foundational phase; integrates US1 run outcomes for stars/progression

### Within Each User Story

- Runtime behavior implementation before tuning/validation tasks
- Core mechanics before visual polish for that story
- Story quickstart validation tasks run after story behavior is complete

### Parallel Opportunities

- Setup tasks `T001` and `T002` can run in parallel (different files)
- Documentation validation tasks `T032` and `T039` can run in parallel with late-stage code stabilization
- Final documentation task `T044` can run in parallel with config verification `T043`

---

## Parallel Example: User Story 2

```bash
# Run in parallel after US2 mechanics stabilize:
Task: "Add manual hazard/visitor validation scenarios and fairness checks in specs/001-deep-signal-game/quickstart.md"
Task: "Implement fairness tuning controls for warning lead time and event cooldown windows in index.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate with US1 independent test criteria from `quickstart.md`
5. Demo/deploy MVP slice

### Incremental Delivery

1. Deliver US1 for core gameplay loop
2. Add US2 for fair challenge depth
3. Add US3 for progression and retention
4. Apply Phase 6 polish before release

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Then split:
   - Developer A: US1 gameplay tuning
   - Developer B: US2 hazards and visitor scheduler
   - Developer C: US3 progression and menus
3. Converge for Phase 6 polish and validation

---

## Notes

- All tasks follow strict checklist format with Task ID, optional parallel marker, and file path
- User-story phases are independently testable increments
- No automated test tasks were added because they were not explicitly requested in the feature specification
