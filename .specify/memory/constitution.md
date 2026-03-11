<!--
Sync Impact Report
- Version change: N/A (template) -> 1.0.0
- Modified principles:
	- [PRINCIPLE_1_NAME] -> I. Static-Only Azure Delivery
	- [PRINCIPLE_2_NAME] -> II. Vanilla Canvas Architecture
	- [PRINCIPLE_3_NAME] -> III. Performance-First Runtime
	- [PRINCIPLE_4_NAME] -> IV. Readable, Tunable Single-State Code
	- [PRINCIPLE_5_NAME] -> V. Fair and Legible Ocean Gameplay
- Added sections:
	- Technical & Deployment Constraints
	- Development Workflow & Quality Gates
- Removed sections:
	- None
- Templates requiring updates:
	- ✅ updated: .specify/templates/plan-template.md
	- ✅ updated: .specify/templates/spec-template.md
	- ✅ updated: .specify/templates/tasks-template.md
	- ✅ no command templates present: .specify/templates/commands/*.md
- Follow-up TODOs:
	- None
-->

# Deep Signal Constitution

## Core Principles

### I. Static-Only Azure Delivery
Deep Signal MUST ship and run as static assets on Azure Static Web Apps with no
server-side code, no API dependencies, and no runtime network calls required for core
gameplay. A `staticwebapp.config.json` file MUST be present and valid for SPA hosting,
and the game entrypoint MUST function from the site root.
Rationale: Static-only deployment maximizes reliability, portability, and low-latency
play across hosting environments.

### II. Vanilla Canvas Architecture
The game MUST be implemented with vanilla JavaScript and HTML5 Canvas 2D rendering.
Frameworks, external libraries, build tools, package managers, and CDN imports are
prohibited. The implementation target is a self-contained `index.html` including HTML,
CSS, and JavaScript unless a documented exception is approved.
Rationale: Zero-dependency architecture keeps delivery simple and ensures deterministic
behavior in constrained browser environments.

### III. Performance-First Runtime
The main loop MUST use `requestAnimationFrame` and MUST sustain a responsive 60fps
experience on target modern desktop and mobile browsers under normal gameplay load.
Grid coordinates MAY be used internally, but rendered movement and effects MUST appear
visually smooth to players.
Rationale: Stable frame pacing and smooth motion are foundational to puzzle readability
and player trust.

### IV. Readable, Tunable Single-State Code
Code MUST prioritize clarity over cleverness and include concise comments where logic is
non-obvious. Gameplay constants (timings, movement, brightness, level configuration,
cooldowns) MUST be centralized in one configuration block near the top of the file.
Mutable runtime data MUST be owned by a single game-state object to prevent global state
pollution.
Rationale: Centralized tuning and predictable state management reduce defects and speed
iteration on balance and difficulty.

### V. Fair and Legible Ocean Gameplay
Gameplay MUST be learnable through play without external instructions. Difficulty MUST
increase through combinational complexity rather than unavoidable events. Randomized
threats MUST provide telegraphed warnings and recovery windows. The visual style MUST
maintain a deep-ocean atmosphere while preserving instant recognizability of divers,
creatures, hazards, and light intensity. The internal grid MUST remain invisible to
players.
Rationale: Fairness plus clear visual communication keeps challenge satisfying instead of
frustrating.

## Technical & Deployment Constraints

- Persistence MUST use `localStorage` for scores and level progress.
- The application MUST remain fully playable when offline after initial load.
- Audio is optional and MUST NOT block or alter gameplay progression.
- If audio exists, it MUST be generated with Web Audio API; external audio files are
	prohibited.
- Canvas creatures and hazards SHOULD be drawn with 2D primitives; bitmap sprite assets
	require explicit justification.
- The game MUST be fully usable with sound disabled or unavailable.

## Development Workflow & Quality Gates

- Every feature PR MUST include evidence of static-host compatibility on Azure Static Web
	Apps (or equivalent local static hosting simulation).
- Every gameplay change MUST document fairness impact, including threat telegraphing and
	avoidability.
- Every visual change MUST verify silhouette clarity and glow contrast in low-light
	scenes.
- Every performance-sensitive change MUST include a short runtime check confirming no
	avoidable frame drops in representative play scenarios.
- Releases MUST preserve save compatibility for existing `localStorage` progress unless
	migration behavior is explicitly documented.

## Governance

This constitution is the authoritative engineering policy for Deep Signal. In case of
conflict, this document overrides ad hoc practices.

Amendment process:
- Changes MUST be proposed in writing with rationale and impact.
- At least one maintainer review MUST explicitly confirm template and workflow alignment.
- Ratified amendments MUST update the Sync Impact Report in this file.

Versioning policy:
- Semantic versioning is mandatory for this constitution.
- MAJOR increments indicate incompatible governance or principle removals/redefinitions.
- MINOR increments indicate new principles, sections, or materially expanded guidance.
- PATCH increments indicate clarifications, wording improvements, or non-semantic edits.

Compliance review expectations:
- Planning artifacts MUST pass Constitution Check gates before implementation begins.
- Task lists MUST trace work back to applicable principles.
- Reviews MUST block merges that violate MUST-level requirements in this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-03-10 | **Last Amended**: 2026-03-10
