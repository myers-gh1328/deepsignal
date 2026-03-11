# Data Model: Deep Signal Puzzle Game

## Overview
The runtime uses one top-level mutable `gameState` object with centralized constants.
Entity models below describe conceptual data structures and relationships.

## Entities

### 1. GameState
- Purpose: Single owner of all mutable runtime state.
- Key fields:
  - `mode`: `mainMenu | levelSelect | playing | levelComplete | levelFailed`
  - `currentLevelId`: number
  - `tickTimeMs`: number
  - `divers`: Diver[]
  - `placedLights`: PlacedLight[]
  - `activeVisitors`: Visitor[]
  - `levelRuntime`: LevelRuntime
  - `hud`: HudState
  - `progress`: ProgressProfile
- Relationships:
  - Owns all runtime entities.
  - References immutable level definition and constants.

### 2. LevelDefinition
- Purpose: Author-defined configuration for one level.
- Key fields:
  - `levelId`: number
  - `gridWidth`, `gridHeight`: number
  - `entranceCell`, `exitCell`: Cell
  - `walls`: Cell[] or segments
  - `hazards`: HazardPlacement[]
  - `diverCount`: number
  - `airDrainPerSecond`: number
  - `inventoryByType`: map creatureType -> quantity
  - `visitorRules`: VisitorRuleSet
- Relationships:
  - Spawns `Diver` instances.
  - Instantiates `Hazard` and drives visitor schedule.

### 3. Diver
- Purpose: Rescue target moving autonomously.
- Key fields:
  - `id`: string
  - `gridPos`: Cell
  - `renderPos`: Vec2
  - `heading`: Direction
  - `speedCellsPerSecond`: number
  - `airCurrent`: number
  - `airMax`: number
  - `status`: `active | saved | lost`
  - `attractionTargetId`: string | null
- State transitions:
  - `active -> saved` when reaching exit zone.
  - `active -> lost` when `airCurrent <= 0`.

### 4. LightSourceType
- Purpose: Catalog definition for placeable creatures.
- Key fields:
  - `typeId`: `dinoflagellates | seaPen | crystalJelly | siphonophore | fireflySquid`
  - `brightnessRank`: number
  - `attractionStrength`: number
  - `activeDurationMs`: number
  - `cooldownMs`: number
  - `glowProfile`: color/intensity metadata
- Relationships:
  - Used by inventory entries and placed light instances.

### 5. InventorySlot
- Purpose: HUD/runtime availability for one creature type.
- Key fields:
  - `typeId`: string
  - `availableCount`: number
  - `cooldownQueue`: CooldownEntry[]
  - `hudState`: `ready | active | cooling`

### 6. PlacedLight
- Purpose: Active instance of player-placed light source.
- Key fields:
  - `instanceId`: string
  - `typeId`: string
  - `cell`: Cell
  - `activeRemainingMs`: number
  - `state`: `active | expired`
- State transitions:
  - `active -> expired` at duration end.
  - `expired -> removed` and associated inventory cooldown begins.

### 7. Hazard
- Purpose: Environmental risk objects.
- Key fields:
  - `hazardId`: string
  - `hazardType`: `electricEel | anglerfish | swarm`
  - `path` or `anchorCell`: movement/placement definition
  - `influenceRadius`: number
  - `airDamage`: number
  - `collisionBehavior`: enum

### 8. VisitorEvent
- Purpose: Scheduled random encounter definition.
- Key fields:
  - `eventId`: string
  - `visitorType`: `shark | dolphin`
  - `species`: species enum or null
  - `spawnWindowMs`: number
  - `warningLeadMs`: number
  - `zone`: quarter or band
  - `state`: `scheduled | warning | active | complete | canceled`
- Validation rules:
  - Shark and dolphin events cannot be `active` simultaneously.
  - Shark zone cannot be entrance quarter.

### 9. Visitor (Runtime)
- Purpose: Active random visitor in the level.
- Key fields:
  - `visitorId`: string
  - `visitorType`: `shark | dolphin`
  - `species`: string
  - `gridPos`: Cell
  - `movementPattern`: enum
  - `effect`: collision outcome metadata

### 10. RunResult
- Purpose: End-of-level summary.
- Key fields:
  - `levelId`: number
  - `savedCount`: number
  - `lostCount`: number
  - `starsAwarded`: 0-3
  - `outcome`: `complete | failed`

### 11. ProgressProfile
- Purpose: Persisted progression and star performance.
- Key fields:
  - `schemaVersion`: number
  - `maxUnlockedLevel`: number
  - `bestStarsByLevel`: map levelId -> stars
  - `lastUpdatedUtc`: string
- Validation rules:
  - Star values are integers in range 0-3.
  - `maxUnlockedLevel >= 1`.

## Supporting Value Objects
- `Cell`: `{ x: number, y: number }`
- `Vec2`: `{ x: number, y: number }`
- `Direction`: `north | south | east | west`
- `HudState`: counters, inventory state projections, level label, star preview
- `LevelRuntime`: timers, visitor schedule cursor, warning overlays, completion flags

## Relationship Summary
- One `LevelDefinition` creates many `Diver`, `Hazard`, and `VisitorEvent` records.
- One `LightSourceType` can have many `PlacedLight` instances over time.
- One `GameState` owns all runtime entities and references one `ProgressProfile`.
- One `RunResult` updates one `ProgressProfile` at level end.
