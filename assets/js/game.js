"use strict";

    // Centralized gameplay constants for quick tuning.
    const C = {
      GRID: { COLS: 32, ROWS: 18 },
      LOOP: { FIXED_MS: 1000 / 60, MAX_FRAME_MS: 250 },
      DIVER: { SPEED_CELLS_PER_SEC: 1.2, START_AIR: 100, CRIT_AIR: 25, PERSONAL_GLOW: 0.16 },
      AIR_DRAIN: {
        BASE_PER_SEC: 1.1,
        PER_LEVEL_ADD: 0.1,
        EEL_HIT: 7,
        ANGLER_ZONE: 5,
        ANGLER_BODY: 8,
        SWARM_ZONE: 3.5
      },
      LIGHT: {
        VIS_RADIUS: 4.5,
        EXIT_BRIGHTNESS: 100,
        SOFT_STEER: 0.22
      },
      VISITOR: {
        WARN_MS_DEFAULT: 2300,
        WARN_MS_HIGH: 1500,
        SHARK_ACTIVE_MS: 7500,
        DOLPHIN_ACTIVE_MS: 6200,
        DOLPHIN_FREQ_FACTOR: 0.5
      },
      WORLD: {
        MAX_LEVEL_FOR_PRESET: 14,
        WALL_MARGIN: 1,
        STAR_3_RATIO: 1,
        STAR_2_RATIO: 0.5,
        LEVEL_TIME_LIMIT_MS: 90000
      },
      STORAGE: { KEY: "deepSignal_v1", VERSION: 1 },
      COLORS: {
        WATER_TOP: "#031322",
        WATER_BOTTOM: "#02070e",
        ROCK: "#101722",
        EXIT: "#fff0bf",
        DIVER: "#cce9ff",
        DINO: "#52b9ff",
        SEA_PEN: "#ffb58c",
        JELLY: "#79ffd6",
        CHAIN: "#b7deff",
        SQUID: "#efffff",
        EEL: "#b4dfff",
        ANGLER: "#8db4df",
        DOLPHIN: "#f5efdd",
        SHARK: "#8ea4b6"
      }
    };

    const CREATURE_TYPES = {
      dinoflagellates: { id: "dinoflagellates", name: "Dinoflagellates", bright: 20, durationMs: 20000, cooldownMs: 5000, color: C.COLORS.DINO },
      seaPen: { id: "seaPen", name: "Sea Pen", bright: 35, durationMs: 15000, cooldownMs: 8000, color: C.COLORS.SEA_PEN },
      crystalJelly: { id: "crystalJelly", name: "Crystal Jelly", bright: 50, durationMs: 12000, cooldownMs: 10000, color: C.COLORS.JELLY },
      siphonophore: { id: "siphonophore", name: "Siphonophore", bright: 32, durationMs: 8000, cooldownMs: 6000, color: C.COLORS.CHAIN },
      fireflySquid: { id: "fireflySquid", name: "Firefly Squid", bright: 72, durationMs: 4000, cooldownMs: 15000, color: C.COLORS.SQUID }
    };

    const TYPE_ORDER = ["dinoflagellates", "seaPen", "crystalJelly", "siphonophore", "fireflySquid"];

    const gameState = {
      mode: "mainMenu",
      levelId: 1,
      tickMs: 0,
      elapsedMs: 0,
      seed: 1,
      canvasRect: null,
      selectedType: null,
      storage: { available: true, warned: false },
      warningText: "",
      warningUntil: 0,
      level: null,
      divers: [],
      placedLights: [],
      hazards: [],
      visitors: [],
      visitorEvents: [],
      inventory: {},
      progress: {
        schemaVersion: C.STORAGE.VERSION,
        maxUnlockedLevel: 1,
        bestStarsByLevel: {},
        lastUpdatedUtc: new Date().toISOString()
      },
      run: {
        saved: 0,
        lost: 0,
        ended: false,
        starsPreview: 0,
        startMs: 0,
        nextSpawnDistance: 0,
        lastSpawnDiverId: null
      },
      particleOffset: 0,
      audio: { enabled: false },
      ui: { showGuides: true }
    };

    const refs = {
      canvas: document.getElementById("stage"),
      wrap: document.getElementById("stage-wrap"),
      overlay: document.getElementById("overlay"),
      inventory: document.getElementById("inventory"),
      warningBanner: document.getElementById("warningBanner"),
      levelLabel: document.getElementById("levelLabel"),
      savedCounter: document.getElementById("savedCounter"),
      starsPreview: document.getElementById("starsPreview"),
      storageWarning: document.getElementById("storageWarning"),
      inventoryHelp: document.getElementById("inventoryHelp")
    };

    const ctx = refs.canvas.getContext("2d", { alpha: false });
    let rafId = 0;
    let accumulator = 0;
    let lastTs = performance.now();
    let idCounter = 0;

    function uid(prefix) {
      idCounter += 1;
      return prefix + "_" + idCounter;
    }

    function mulberry32(seed) {
      let a = seed >>> 0;
      return function () {
        a += 0x6D2B79F5;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    function levelBand(level) {
      if (level <= 2) return { divers: 1, inventory: { dinoflagellates: 2, crystalJelly: 2 }, shark: { chance: 0, max: 0, species: [] } };
      if (level <= 4) return { divers: 2, inventory: { crystalJelly: 3, seaPen: 2 }, shark: { chance: 0.1, max: 1, species: ["bull"] } };
      if (level <= 6) return { divers: 3, inventory: { crystalJelly: 3, seaPen: 2, dinoflagellates: 2 }, shark: { chance: 0.25, max: 1, species: ["bull", "hammerhead"] } };
      if (level <= 8) return { divers: 4, inventory: { crystalJelly: 3, seaPen: 2, dinoflagellates: 2, siphonophore: 2 }, shark: { chance: 0.4, max: 1, species: ["bull", "hammerhead", "greatWhite"] } };
      if (level <= 10) return { divers: 5, inventory: { crystalJelly: 3, seaPen: 2, dinoflagellates: 2, siphonophore: 2, fireflySquid: 1 }, shark: { chance: 0.55, max: 2, species: ["bull", "hammerhead", "greatWhite"] } };
      return { divers: 5, inventory: { crystalJelly: 4, seaPen: 3, dinoflagellates: 3, siphonophore: 3, fireflySquid: 2 }, shark: { chance: 0.7, max: 2, species: ["bull", "hammerhead", "greatWhite"] } };
    }

    function makeLevel(levelId) {
      const band = levelBand(levelId);
      const rng = mulberry32((levelId * 99991) ^ 0xA3B35F);
      const cols = C.GRID.COLS;
      const rows = C.GRID.ROWS;
      const walls = [];
      for (let x = 0; x < cols; x += 1) {
        walls.push({ x, y: 0 });
        walls.push({ x, y: rows - 1 });
      }
      for (let y = 1; y < rows - 1; y += 1) {
        walls.push({ x: 0, y });
        walls.push({ x: cols - 1, y });
      }

      for (let i = 0; i < 50 + levelId * 2; i += 1) {
        if (rng() < 0.43) {
          const x = 3 + Math.floor(rng() * (cols - 7));
          const y = 2 + Math.floor(rng() * (rows - 4));
          if (x > 3 && x < cols - 3) {
            walls.push({ x, y });
          }
        }
      }

      const hazards = [];
      for (let i = 0; i < 2 + Math.floor(levelId / 3); i += 1) {
        hazards.push({
          id: uid("eel"),
          type: "electricEel",
          x: 6 + Math.floor(rng() * (cols - 10)),
          y: 2 + Math.floor(rng() * (rows - 4)),
          pathLen: 2 + Math.floor(rng() * 3),
          dir: rng() < 0.5 ? 1 : -1,
          axis: rng() < 0.5 ? "x" : "y",
          t: 0
        });
      }
      if (levelId >= 5) {
        for (let i = 0; i < 1 + Math.floor(levelId / 4); i += 1) {
          hazards.push({
            id: uid("angler"),
            type: "anglerfish",
            x: 8 + Math.floor(rng() * (cols - 12)),
            y: 2 + Math.floor(rng() * (rows - 4)),
            radius: 2 + Math.floor(rng() * 2)
          });
        }
      }
      if (levelId >= 5) {
        for (let i = 0; i < 1 + Math.floor(levelId / 5); i += 1) {
          hazards.push({
            id: uid("swarm"),
            type: "swarm",
            x: 8 + Math.floor(rng() * (cols - 12)),
            y: 3 + Math.floor(rng() * (rows - 6)),
            span: 3 + Math.floor(rng() * 4),
            axis: rng() < 0.5 ? "x" : "y",
            dir: rng() < 0.5 ? 1 : -1
          });
        }
      }

      const inventory = {};
      TYPE_ORDER.forEach((id) => {
        inventory[id] = { available: band.inventory[id] || 0, activeCount: 0, cooldowns: [] };
      });

      const entrance = { x: 1, y: Math.floor(rows / 2) };
      const exit = { x: cols - 2, y: Math.floor(rows / 2) };

      return {
        id: levelId,
        cols,
        rows,
        walls,
        hazards,
        entrance,
        exit,
        diverCount: band.divers,
        sharkRules: band.shark,
        inventory,
        rng,
        airDrain: C.AIR_DRAIN.BASE_PER_SEC + C.AIR_DRAIN.PER_LEVEL_ADD * (levelId - 1),
        visitorSchedule: buildVisitorSchedule(levelId, band, rng)
      };
    }

    function buildVisitorSchedule(levelId, band, rng) {
      const events = [];
      let t = 8500;
      for (let slot = 0; slot < 8; slot += 1) {
        t += 4500 + Math.floor(rng() * 3000);
        const canShark = band.shark.max > 0 && rng() < band.shark.chance;
        let type = null;
        if (canShark) {
          type = "shark";
        } else if (levelId > 2 && rng() < band.shark.chance * C.VISITOR.DOLPHIN_FREQ_FACTOR) {
          type = "dolphin";
        }
        if (!type) continue;
        const warningMs = levelId >= 11 ? C.VISITOR.WARN_MS_HIGH : C.VISITOR.WARN_MS_DEFAULT;
        if (type === "shark") {
          const zone = 2 + Math.floor(rng() * 3);
          const species = band.shark.species[Math.floor(rng() * band.shark.species.length)];
          events.push({ id: uid("event"), type, species, zone, warnAt: t - warningMs, startAt: t, endAt: t + C.VISITOR.SHARK_ACTIVE_MS, state: "scheduled" });
        } else {
          const bandY = 3 + Math.floor(rng() * (C.GRID.ROWS - 6));
          events.push({ id: uid("event"), type, species: "dolphin", bandY, warnAt: t - warningMs, startAt: t, endAt: t + C.VISITOR.DOLPHIN_ACTIVE_MS, state: "scheduled" });
        }
      }
      return events;
    }

    function loadProgress() {
      try {
        const raw = window.localStorage.getItem(C.STORAGE.KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return;
        if (parsed.schemaVersion !== C.STORAGE.VERSION) return;
        if (typeof parsed.maxUnlockedLevel !== "number" || parsed.maxUnlockedLevel < 1) return;
        if (!parsed.bestStarsByLevel || typeof parsed.bestStarsByLevel !== "object") return;
        gameState.progress.maxUnlockedLevel = parsed.maxUnlockedLevel;
        gameState.progress.bestStarsByLevel = parsed.bestStarsByLevel;
        gameState.progress.lastUpdatedUtc = parsed.lastUpdatedUtc || new Date().toISOString();
      } catch (err) {
        gameState.storage.available = false;
      }
    }

    function saveProgress() {
      if (!gameState.storage.available) return;
      try {
        gameState.progress.lastUpdatedUtc = new Date().toISOString();
        window.localStorage.setItem(C.STORAGE.KEY, JSON.stringify(gameState.progress));
      } catch (err) {
        gameState.storage.available = false;
      }
    }

    function createDiver(index) {
      const startY = gameState.level.entrance.y + (index % 2 === 0 ? 0 : (index % 3) - 1);
      return {
        id: uid("diver"),
        x: gameState.level.entrance.x,
        y: clamp(startY, 1, C.GRID.ROWS - 2),
        renderX: gameState.level.entrance.x,
        renderY: clamp(startY, 1, C.GRID.ROWS - 2),
        dirX: 1,
        dirY: 0,
        speed: C.DIVER.SPEED_CELLS_PER_SEC,
        air: C.DIVER.START_AIR,
        status: "active",
        spawnedAtDistance: index * 4,
        distanceMoved: 0,
        phase: "queued"
      };
    }

    function beginLevel(levelId) {
      gameState.levelId = levelId;
      gameState.mode = "playing";
      gameState.level = makeLevel(levelId);
      gameState.hazards = JSON.parse(JSON.stringify(gameState.level.hazards));
      gameState.divers = [];
      for (let i = 0; i < gameState.level.diverCount; i += 1) {
        gameState.divers.push(createDiver(i));
      }
      gameState.placedLights = [];
      gameState.visitors = [];
      gameState.visitorEvents = gameState.level.visitorSchedule.map((v) => ({ ...v }));
      gameState.inventory = JSON.parse(JSON.stringify(gameState.level.inventory));
      gameState.selectedType = getDefaultInventoryType();
      gameState.elapsedMs = 0;
      gameState.run = {
        saved: 0,
        lost: 0,
        ended: false,
        starsPreview: 0,
        startMs: performance.now(),
        nextSpawnDistance: 0,
        lastSpawnDiverId: null
      };
      hideOverlay();
      updateHud();
      updateInventoryHud();
    }

    function setMode(mode) {
      gameState.mode = mode;
      if (mode === "mainMenu") {
        showMainMenu();
      } else if (mode === "levelSelect") {
        showLevelSelect();
      }
    }

    function showMainMenu() {
      refs.overlay.innerHTML = "";
      const panel = document.createElement("div");
      panel.className = "panel";
      panel.innerHTML = "<h1>Deep Signal</h1><p>Guide lost divers through blackwater caves by placing bioluminescent life.</p><p>Your lights are temporary. Air is not.</p><p><strong>How to play:</strong> click a light in the bottom bar, then click the cave to place it. Divers follow brighter light. Reach the glowing <strong>SUB EXIT</strong> circle before air runs out.</p>";
      const hs = document.createElement("p");
      let best = 0;
      Object.values(gameState.progress.bestStarsByLevel).forEach((n) => { best += Number(n) || 0; });
      hs.textContent = "Total stars: " + best + " | Unlocked level: " + gameState.progress.maxUnlockedLevel;
      panel.appendChild(hs);
      const actions = document.createElement("div");
      actions.className = "actions";
      const playBtn = document.createElement("button");
      playBtn.textContent = "Play";
      playBtn.addEventListener("click", () => beginLevel(1));
      const selectBtn = document.createElement("button");
      selectBtn.className = "secondary";
      selectBtn.textContent = "Level Select";
      selectBtn.addEventListener("click", () => setMode("levelSelect"));
      actions.append(playBtn, selectBtn);
      panel.appendChild(actions);
      refs.overlay.appendChild(panel);
    }

    function showLevelSelect() {
      refs.overlay.innerHTML = "";
      const panel = document.createElement("div");
      panel.className = "panel";
      panel.innerHTML = "<h2>Select Level</h2><p>Locked levels are dimmed. Beat a level to unlock the next.</p>";
      const grid = document.createElement("div");
      grid.className = "levels";
      const maxShown = Math.max(C.WORLD.MAX_LEVEL_FOR_PRESET, gameState.progress.maxUnlockedLevel + 1);
      for (let i = 1; i <= maxShown; i += 1) {
        const chip = document.createElement("div");
        const locked = i > gameState.progress.maxUnlockedLevel;
        chip.className = "level-chip" + (locked ? " locked" : "");
        const stars = gameState.progress.bestStarsByLevel[i] || 0;
        chip.textContent = "L" + i + " | " + "*".repeat(stars);
        if (!locked) chip.addEventListener("click", () => beginLevel(i));
        grid.appendChild(chip);
      }
      panel.appendChild(grid);
      const actions = document.createElement("div");
      actions.className = "actions";
      const back = document.createElement("button");
      back.className = "secondary";
      back.textContent = "Back";
      back.addEventListener("click", () => setMode("mainMenu"));
      actions.appendChild(back);
      panel.appendChild(actions);
      refs.overlay.appendChild(panel);
    }

    function showResult(title, stars, canNext) {
      refs.overlay.innerHTML = "";
      const panel = document.createElement("div");
      panel.className = "panel";
      panel.innerHTML = "<h2>" + title + "</h2>" +
        "<p>Saved " + gameState.run.saved + " of " + gameState.level.diverCount + " divers.</p>" +
        "<p>Stars: " + "*".repeat(stars) + "</p>";
      const actions = document.createElement("div");
      actions.className = "actions";
      const retry = document.createElement("button");
      retry.textContent = "Retry";
      retry.addEventListener("click", () => beginLevel(gameState.levelId));
      actions.appendChild(retry);
      if (canNext) {
        const next = document.createElement("button");
        next.textContent = "Next Level";
        next.addEventListener("click", () => beginLevel(gameState.levelId + 1));
        actions.appendChild(next);
      }
      const select = document.createElement("button");
      select.className = "secondary";
      select.textContent = "Level Select";
      select.addEventListener("click", () => setMode("levelSelect"));
      actions.appendChild(select);
      panel.appendChild(actions);
      refs.overlay.appendChild(panel);
    }

    function hideOverlay() { refs.overlay.innerHTML = ""; }

    function getDefaultInventoryType() {
      for (const typeId of TYPE_ORDER) {
        const slot = gameState.inventory[typeId];
        if (slot && slot.available > 0) return typeId;
      }
      return TYPE_ORDER[0];
    }

    function selectInventoryType(typeId) {
      if (!TYPE_ORDER.includes(typeId)) return;
      gameState.selectedType = typeId;
      updateInventoryHud();
    }

    function updateInventoryHud() {
      if (!gameState.selectedType || !TYPE_ORDER.includes(gameState.selectedType)) {
        gameState.selectedType = getDefaultInventoryType();
      }

      if (refs.inventoryHelp) {
        refs.inventoryHelp.textContent = "Select light: [1] Dinoflagellates  [2] Sea Pen  [3] Crystal Jelly  [4] Siphonophore  [5] Firefly Squid";
      }

      refs.inventory.innerHTML = "";
      TYPE_ORDER.forEach((typeId, idx) => {
        const type = CREATURE_TYPES[typeId];
        const slot = gameState.inventory[typeId];
        const div = document.createElement("button");
        div.type = "button";
        const isCooling = slot.cooldowns.length > 0 && slot.available === 0;
        const isActive = slot.activeCount > 0;
        let cls = "slot ";
        cls += isCooling ? "cooling" : (isActive ? "active" : "ready");
        if (gameState.selectedType === typeId) cls += " selected";
        div.className = cls;
        div.setAttribute("aria-label", "Select " + type.name + " (" + (idx + 1) + ")");
        const coolLeft = slot.cooldowns.length ? Math.max(0, Math.ceil(slot.cooldowns[0] / 1000)) : 0;
        div.innerHTML = "<div class='slot-name'>[" + (idx + 1) + "] " + type.name + "</div>" +
                        "<div class='slot-meta'>" +
                        "Ready: " + slot.available + " | Active: " + slot.activeCount +
                        (coolLeft > 0 ? " | CD " + coolLeft + "s" : "") +
                        "</div>";
        div.dataset.typeId = typeId;
        div.addEventListener("pointerdown", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          selectInventoryType(typeId);
        });
        div.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          selectInventoryType(typeId);
        });
        refs.inventory.appendChild(div);
      });
    }

    function onInventoryPointer(ev) {
      const slotEl = ev.target.closest(".slot");
      if (!slotEl) return;
      ev.preventDefault();
      ev.stopPropagation();
      const typeId = slotEl.dataset.typeId;
      selectInventoryType(typeId);
    }

    function onInventoryHotkey(ev) {
      if (gameState.mode !== "playing") return;
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      let n = Number(ev.key);
      if (!Number.isInteger(n)) {
        const digitMatch = /^Digit([1-5])$/.exec(ev.code || "");
        const numpadMatch = /^Numpad([1-5])$/.exec(ev.code || "");
        if (digitMatch) n = Number(digitMatch[1]);
        else if (numpadMatch) n = Number(numpadMatch[1]);
      }
      if (!Number.isInteger(n) || n < 1 || n > TYPE_ORDER.length) return;
      ev.preventDefault();
      selectInventoryType(TYPE_ORDER[n - 1]);
    }

    function gridToPx(x, y) {
      const cw = refs.canvas.width / C.GRID.COLS;
      const ch = refs.canvas.height / C.GRID.ROWS;
      return { x: (x + 0.5) * cw, y: (y + 0.5) * ch, cw, ch };
    }

    function pxToGrid(px, py) {
      const cw = refs.canvas.width / C.GRID.COLS;
      const ch = refs.canvas.height / C.GRID.ROWS;
      return {
        x: clamp(Math.floor(px / cw), 1, C.GRID.COLS - 2),
        y: clamp(Math.floor(py / ch), 1, C.GRID.ROWS - 2)
      };
    }

    function isWall(x, y) {
      return gameState.level.walls.some((w) => w.x === x && w.y === y);
    }

    function placeSelectedAt(cellX, cellY) {
      if (gameState.mode !== "playing" || gameState.run.ended) return;
      const typeId = gameState.selectedType;
      const slot = gameState.inventory[typeId];
      if (!slot || slot.available <= 0) return;
      if (isWall(cellX, cellY) || (cellX === gameState.level.exit.x && cellY === gameState.level.exit.y)) return;
      if (gameState.placedLights.some((l) => l.x === cellX && l.y === cellY)) return;

      const t = CREATURE_TYPES[typeId];
      slot.available -= 1;
      slot.activeCount += 1;
      gameState.placedLights.push({ id: uid("light"), typeId, x: cellX, y: cellY, activeMs: t.durationMs });
      updateInventoryHud();
    }

    function handleCanvasPointer(ev) {
      if (gameState.mode !== "playing") return;
      const rect = refs.canvas.getBoundingClientRect();
      const sx = (ev.clientX - rect.left) * (refs.canvas.width / rect.width);
      const sy = (ev.clientY - rect.top) * (refs.canvas.height / rect.height);
      const cell = pxToGrid(sx, sy);
      placeSelectedAt(cell.x, cell.y);
    }

    function detectCollisionWithDivers(diver, nextX, nextY) {
      for (const other of gameState.divers) {
        if (other.id === diver.id || other.status !== "active") continue;
        if (Math.round(other.x) === Math.round(nextX) && Math.round(other.y) === Math.round(nextY)) {
          return true;
        }
      }
      return false;
    }

    function getAttractionVector(diver) {
      let best = { score: -Infinity, dx: 0, dy: 0 };
      for (const l of gameState.placedLights) {
        const t = CREATURE_TYPES[l.typeId];
        const dx = l.x - diver.x;
        const dy = l.y - diver.y;
        const d = Math.hypot(dx, dy);
        if (d <= 0.01 || d > C.LIGHT.VIS_RADIUS) continue;
        const score = t.bright * 10 - d;
        if (score > best.score) {
          best = { score, dx: dx / d, dy: dy / d };
        }
      }
      const ex = gameState.level.exit.x - diver.x;
      const ey = gameState.level.exit.y - diver.y;
      const ed = Math.hypot(ex, ey);
      if (ed < C.LIGHT.VIS_RADIUS * 2) {
        const score = C.LIGHT.EXIT_BRIGHTNESS * 10 - ed;
        if (score > best.score) {
          best = { score, dx: ex / Math.max(ed, 0.001), dy: ey / Math.max(ed, 0.001) };
        }
      }
      if (best.score === -Infinity) return null;
      return best;
    }

    function applyHazardEffects(diver) {
      for (const hz of gameState.hazards) {
        if (hz.type === "electricEel") {
          const d = Math.hypot(diver.x - hz.x, diver.y - hz.y);
          if (d < 0.55) diver.air -= C.AIR_DRAIN.EEL_HIT * (C.LOOP.FIXED_MS / 1000);
        } else if (hz.type === "anglerfish") {
          const d = Math.hypot(diver.x - hz.x, diver.y - hz.y);
          if (d <= hz.radius) diver.air -= C.AIR_DRAIN.ANGLER_ZONE * (C.LOOP.FIXED_MS / 1000);
          if (d < 0.45) diver.air -= C.AIR_DRAIN.ANGLER_BODY * (C.LOOP.FIXED_MS / 1000);
        } else if (hz.type === "swarm") {
          const d = Math.hypot(diver.x - hz.x, diver.y - hz.y);
          if (d < hz.span * 0.4) diver.air -= C.AIR_DRAIN.SWARM_ZONE * (C.LOOP.FIXED_MS / 1000);
        }
      }

      for (const v of gameState.visitors) {
        const d = Math.hypot(diver.x - v.x, diver.y - v.y);
        if (v.type === "shark" && d < (v.species === "greatWhite" ? 1.2 : 0.75)) {
          diver.dirX *= -1;
          diver.dirY *= -1;
        }
        if (v.type === "dolphin" && d < 0.7) {
          const carry = 2;
          diver.x = clamp(diver.x + carry, 1, C.GRID.COLS - 2);
          diver.y = clamp(diver.y, 1, C.GRID.ROWS - 2);
        }
      }
    }

    function updateHazards(dtSec) {
      for (const hz of gameState.hazards) {
        if (hz.type === "electricEel") {
          hz.t += dtSec * 0.8;
          const wave = Math.sin(hz.t);
          if (hz.axis === "x") {
            hz.x = clamp(hz.x + hz.dir * wave * 0.06, 2, C.GRID.COLS - 3);
          } else {
            hz.y = clamp(hz.y + hz.dir * wave * 0.06, 2, C.GRID.ROWS - 3);
          }
        }
        if (hz.type === "swarm") {
          if (hz.axis === "x") {
            hz.x += hz.dir * dtSec * 0.7;
            if (hz.x < 4 || hz.x > C.GRID.COLS - 5) hz.dir *= -1;
          } else {
            hz.y += hz.dir * dtSec * 0.7;
            if (hz.y < 2 || hz.y > C.GRID.ROWS - 3) hz.dir *= -1;
          }
        }
      }
    }

    function canSpawnVisitor(type) {
      if (type === "dolphin") {
        return !gameState.visitors.some((v) => v.type === "shark");
      }
      if (type === "shark") {
        return !gameState.visitors.some((v) => v.type === "dolphin") &&
               gameState.visitors.filter((v) => v.type === "shark").length < gameState.level.sharkRules.max;
      }
      return false;
    }

    function spawnVisitor(event) {
      if (!canSpawnVisitor(event.type)) {
        event.state = "canceled";
        return;
      }
      if (event.type === "shark") {
        const zone = event.zone;
        const quarterStart = Math.floor((zone - 1) * C.GRID.COLS / 4);
        const quarterEnd = Math.floor(zone * C.GRID.COLS / 4) - 1;
        gameState.visitors.push({
          id: uid("shark"),
          type: "shark",
          species: event.species,
          x: quarterStart + 1,
          y: 2 + Math.floor(gameState.level.rng() * (C.GRID.ROWS - 4)),
          dirX: gameState.level.rng() < 0.5 ? 1 : -1,
          dirY: 0,
          zone,
          quarterStart,
          quarterEnd,
          endAt: event.endAt
        });
      } else {
        gameState.visitors.push({
          id: uid("dolphin"),
          type: "dolphin",
          species: "dolphin",
          x: Math.floor(C.GRID.COLS * 0.3 + gameState.level.rng() * C.GRID.COLS * 0.4),
          y: event.bandY,
          dirY: gameState.level.rng() < 0.5 ? 1 : -1,
          endAt: event.endAt
        });
      }
      event.state = "active";
    }

    function updateVisitors(dtSec) {
      const t = gameState.elapsedMs;
      for (const ev of gameState.visitorEvents) {
        if (ev.state === "scheduled" && t >= ev.warnAt) {
          ev.state = "warning";
          if (ev.type === "shark") {
            gameState.warningText = "Shark signal in quarter " + ev.zone + "...";
          } else {
            gameState.warningText = "Dolphin signal detected...";
          }
          gameState.warningUntil = t + Math.max(1200, ev.startAt - ev.warnAt);
        }
        if ((ev.state === "warning" || ev.state === "scheduled") && t >= ev.startAt) {
          spawnVisitor(ev);
        }
      }

      for (const v of gameState.visitors) {
        if (v.type === "shark") {
          const speed = v.species === "bull" ? 2.7 : (v.species === "hammerhead" ? 2.0 : 1.5);
          if (v.species === "bull" && gameState.level.rng() < 0.05) {
            v.dirY = [-1, 0, 1][Math.floor(gameState.level.rng() * 3)];
            v.dirX = gameState.level.rng() < 0.5 ? -1 : 1;
          }
          if (v.species === "hammerhead") {
            v.dirY = Math.sin(gameState.elapsedMs / 450) * 0.8;
          }
          v.x += v.dirX * speed * dtSec;
          v.y += v.dirY * speed * dtSec;
          if (v.x < v.quarterStart + 0.5 || v.x > v.quarterEnd - 0.5) {
            v.dirX *= -1;
          }
          v.y = clamp(v.y, 1, C.GRID.ROWS - 2);
        } else {
          v.y += v.dirY * 1.2 * dtSec;
          if (v.y < 1 || v.y > C.GRID.ROWS - 2) v.dirY *= -1;
        }
      }

      gameState.visitors = gameState.visitors.filter((v) => t < v.endAt);
    }

    function updateInventory(dtMs) {
      let changed = false;
      TYPE_ORDER.forEach((typeId) => {
        const slot = gameState.inventory[typeId];
        for (let i = slot.cooldowns.length - 1; i >= 0; i -= 1) {
          slot.cooldowns[i] -= dtMs;
          if (slot.cooldowns[i] <= 0) {
            slot.cooldowns.splice(i, 1);
            slot.available += 1;
            changed = true;
          }
        }
      });
      if (changed) updateInventoryHud();
    }

    function updateLights(dtMs) {
      let changed = false;
      for (let i = gameState.placedLights.length - 1; i >= 0; i -= 1) {
        const l = gameState.placedLights[i];
        l.activeMs -= dtMs;
        if (l.activeMs <= 0) {
          const slot = gameState.inventory[l.typeId];
          const t = CREATURE_TYPES[l.typeId];
          slot.activeCount = Math.max(0, slot.activeCount - 1);
          slot.cooldowns.push(t.cooldownMs);
          gameState.placedLights.splice(i, 1);
          changed = true;
        }
      }
      if (changed) updateInventoryHud();
    }

    function updateDivers(dtSec) {
      const speedStep = dtSec;
      for (const diver of gameState.divers) {
        if (diver.status !== "active") continue;

        if (diver.phase === "queued") {
          const ref = gameState.run.lastSpawnDiverId ? gameState.divers.find((d) => d.id === gameState.run.lastSpawnDiverId) : null;
          if (!ref || ref.distanceMoved >= 4) {
            diver.phase = "active";
            gameState.run.lastSpawnDiverId = diver.id;
          } else {
            continue;
          }
        }

        diver.air -= gameState.level.airDrain * dtSec;

        const attract = getAttractionVector(diver);
        if (attract) {
          diver.dirX = diver.dirX * (1 - C.LIGHT.SOFT_STEER) + attract.dx * C.LIGHT.SOFT_STEER;
          diver.dirY = diver.dirY * (1 - C.LIGHT.SOFT_STEER) + attract.dy * C.LIGHT.SOFT_STEER;
          const len = Math.hypot(diver.dirX, diver.dirY) || 1;
          diver.dirX /= len;
          diver.dirY /= len;
        }

        let nextX = diver.x + diver.dirX * diver.speed * speedStep;
        let nextY = diver.y + diver.dirY * diver.speed * speedStep;

        const hitWall = isWall(Math.round(nextX), Math.round(nextY));
        const hitDiver = detectCollisionWithDivers(diver, nextX, nextY);
        if (hitWall || hitDiver || nextX < 1 || nextX > C.GRID.COLS - 2 || nextY < 1 || nextY > C.GRID.ROWS - 2) {
          diver.dirX *= -1;
          diver.dirY *= -1;
          nextX = diver.x + diver.dirX * diver.speed * speedStep;
          nextY = diver.y + diver.dirY * diver.speed * speedStep;
        }

        diver.x = clamp(nextX, 1, C.GRID.COLS - 2);
        diver.y = clamp(nextY, 1, C.GRID.ROWS - 2);
        diver.distanceMoved += diver.speed * speedStep;

        applyHazardEffects(diver);

        if (Math.hypot(diver.x - gameState.level.exit.x, diver.y - gameState.level.exit.y) < 0.55) {
          diver.status = "saved";
          gameState.run.saved += 1;
          continue;
        }

        if (diver.air <= 0) {
          diver.air = 0;
          diver.status = "lost";
          gameState.run.lost += 1;
        }
      }
    }

    function computeStars(saved, total) {
      if (saved <= 0) return 0;
      if (saved === total) return 3;
      if (saved >= Math.ceil(total * C.WORLD.STAR_2_RATIO)) return 2;
      return 1;
    }

    function finalizeLevel() {
      if (gameState.run.ended) return;
      const done = gameState.divers.every((d) => d.status !== "active");
      const timeout = gameState.elapsedMs >= C.WORLD.LEVEL_TIME_LIMIT_MS;
      if (!done && !timeout) return;

      gameState.run.ended = true;
      const stars = computeStars(gameState.run.saved, gameState.level.diverCount);
      const levelId = gameState.levelId;
      const best = gameState.progress.bestStarsByLevel[levelId] || 0;
      gameState.progress.bestStarsByLevel[levelId] = Math.max(best, stars);
      if (stars > 0 && levelId >= gameState.progress.maxUnlockedLevel) {
        gameState.progress.maxUnlockedLevel = levelId + 1;
      }
      saveProgress();

      if (stars > 0) {
        gameState.mode = "levelComplete";
        showResult("Level Complete", stars, true);
      } else {
        gameState.mode = "levelFailed";
        showResult("Level Failed", 0, false);
      }
    }

    function updateHud() {
      refs.levelLabel.textContent = "Level " + gameState.levelId;
      const total = gameState.level ? gameState.level.diverCount : 0;
      refs.savedCounter.textContent = "Saved: " + gameState.run.saved + "/" + total;
      const preview = computeStars(gameState.run.saved, total || 1);
      gameState.run.starsPreview = preview;
      refs.starsPreview.textContent = "Stars: " + "*".repeat(preview);

      refs.storageWarning.hidden = gameState.storage.available;
      refs.warningBanner.hidden = !(gameState.warningUntil > gameState.elapsedMs);
      if (!refs.warningBanner.hidden) {
        refs.warningBanner.textContent = gameState.warningText;
      }
    }

    function drawAmbient(t) {
      ctx.fillStyle = C.COLORS.WATER_BOTTOM;
      ctx.fillRect(0, 0, refs.canvas.width, refs.canvas.height);
      const grad = ctx.createLinearGradient(0, 0, 0, refs.canvas.height);
      grad.addColorStop(0, C.COLORS.WATER_TOP);
      grad.addColorStop(1, C.COLORS.WATER_BOTTOM);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, refs.canvas.width, refs.canvas.height);

      for (let i = 0; i < 80; i += 1) {
        const x = ((i * 73 + t * 0.01) % refs.canvas.width);
        const y = ((i * 131 + t * 0.02) % refs.canvas.height);
        const a = 0.05 + ((i % 7) / 70);
        ctx.fillStyle = "rgba(120,200,255," + a.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(x, y, 1.2 + (i % 3) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawWalls() {
      const cw = refs.canvas.width / C.GRID.COLS;
      const ch = refs.canvas.height / C.GRID.ROWS;
      ctx.fillStyle = C.COLORS.ROCK;
      for (const w of gameState.level.walls) {
        ctx.fillRect(w.x * cw, w.y * ch, cw, ch);
        ctx.strokeStyle = "rgba(168, 193, 219, 0.18)";
        ctx.strokeRect(w.x * cw + 0.5, w.y * ch + 0.5, Math.max(1, cw - 1), Math.max(1, ch - 1));
      }
    }

    function drawTag(text, x, y, opts) {
      const bg = (opts && opts.bg) || "rgba(7, 21, 36, 0.88)";
      const fg = (opts && opts.fg) || "#e6f2ff";
      const fs = (opts && opts.fs) || 11;
      const padX = 6;
      const padY = 3;
      ctx.save();
      ctx.font = "600 " + fs + "px Trebuchet MS";
      const m = ctx.measureText(text);
      const w = m.width + padX * 2;
      const h = fs + padY * 2;
      ctx.fillStyle = bg;
      ctx.fillRect(x - w / 2, y - h, w, h);
      ctx.strokeStyle = "rgba(170, 210, 245, 0.42)";
      ctx.strokeRect(x - w / 2 + 0.5, y - h + 0.5, w - 1, h - 1);
      ctx.fillStyle = fg;
      ctx.fillText(text, x - m.width / 2, y - padY - 1);
      ctx.restore();
    }

    function glow(px, py, r, color, alpha) {
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, color.replace("#", "#"));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawFishSilhouette(px, py, size, dirX, bodyColor, finColor) {
      const dir = dirX >= 0 ? 1 : -1;
      ctx.save();
      ctx.translate(px, py);
      if (dir < 0) ctx.scale(-1, 1);

      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.65, size * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = finColor;
      ctx.beginPath();
      ctx.moveTo(-size * 0.58, 0);
      ctx.lineTo(-size * 0.95, -size * 0.22);
      ctx.lineTo(-size * 0.95, size * 0.22);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-size * 0.1, -size * 0.2);
      ctx.lineTo(size * 0.12, -size * 0.48);
      ctx.lineTo(size * 0.26, -size * 0.14);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#f8fcff";
      ctx.beginPath();
      ctx.arc(size * 0.45, -size * 0.05, size * 0.07, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0c1a2a";
      ctx.beginPath();
      ctx.arc(size * 0.47, -size * 0.05, size * 0.03, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawDiverSilhouette(px, py, size, dirX, dirY) {
      const len = Math.hypot(dirX, dirY) || 1;
      const nx = dirX / len;
      const ny = dirY / len;
      const angle = Math.atan2(ny, nx);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);

      ctx.fillStyle = "#2d4f6c";
      ctx.beginPath();
      ctx.roundRect(-size * 0.35, -size * 0.16, size * 0.62, size * 0.32, size * 0.12);
      ctx.fill();

      ctx.fillStyle = "#6db2e5";
      ctx.beginPath();
      ctx.roundRect(-size * 0.1, -size * 0.21, size * 0.22, size * 0.18, size * 0.05);
      ctx.fill();

      ctx.fillStyle = "#1c3245";
      ctx.beginPath();
      ctx.arc(size * 0.29, 0, size * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#8ad6ff";
      ctx.lineWidth = Math.max(1.5, size * 0.04);
      ctx.beginPath();
      ctx.moveTo(size * 0.06, -size * 0.08);
      ctx.lineTo(size * 0.2, -size * 0.02);
      ctx.stroke();

      ctx.fillStyle = "#84dfff";
      ctx.beginPath();
      ctx.moveTo(-size * 0.42, -size * 0.1);
      ctx.lineTo(-size * 0.62, -size * 0.22);
      ctx.lineTo(-size * 0.62, 0.02);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-size * 0.42, size * 0.1);
      ctx.lineTo(-size * 0.62, size * 0.22);
      ctx.lineTo(-size * 0.62, -0.02);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    function drawExit() {
      const p = gridToPx(gameState.level.exit.x, gameState.level.exit.y);
      glow(p.x, p.y, Math.max(p.cw, p.ch) * 3.2, C.COLORS.EXIT, 0.5);
      ctx.fillStyle = "#fff2ca";
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.min(p.cw, p.ch) * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffd98b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.min(p.cw, p.ch) * 0.54, 0, Math.PI * 2);
      ctx.stroke();
      if (gameState.ui.showGuides) drawTag("SUB EXIT", p.x, p.y - p.ch * 0.65, { bg: "rgba(43, 32, 10, 0.88)", fg: "#ffe8b6" });
    }

    function drawLights() {
      const t = gameState.elapsedMs;
      for (const l of gameState.placedLights) {
        const def = CREATURE_TYPES[l.typeId];
        const p = gridToPx(l.x, l.y);
        const radius = Math.max(p.cw, p.ch) * (1 + def.bright / 40);
        glow(p.x, p.y, radius, def.color, 0.38);

        ctx.strokeStyle = def.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const full = def.durationMs;
        const ratio = clamp(l.activeMs / full, 0, 1);
        ctx.arc(p.x, p.y, Math.min(p.cw, p.ch) * 0.45, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
        ctx.stroke();

        if (l.typeId === "seaPen") {
          ctx.strokeStyle = "#ffbf96";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y + p.ch * 0.32);
          ctx.lineTo(p.x, p.y - p.ch * 0.16);
          ctx.stroke();
          for (let i = 0; i < 4; i += 1) {
            const oy = -p.ch * 0.14 + i * p.ch * 0.08;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y + oy);
            ctx.lineTo(p.x + p.cw * 0.13, p.y + oy - p.ch * 0.04);
            ctx.moveTo(p.x, p.y + oy + p.ch * 0.01);
            ctx.lineTo(p.x - p.cw * 0.13, p.y + oy - p.ch * 0.03);
            ctx.stroke();
          }
        } else if (l.typeId === "crystalJelly") {
          ctx.fillStyle = "#9afde1";
          ctx.beginPath();
          ctx.ellipse(p.x, p.y - p.ch * 0.05, p.cw * 0.2, p.ch * 0.14, 0, Math.PI, 0, true);
          ctx.fill();
          ctx.strokeStyle = "#c9ffef";
          for (let i = -1; i <= 1; i += 1) {
            ctx.beginPath();
            ctx.moveTo(p.x + i * p.cw * 0.08, p.y - p.ch * 0.01);
            ctx.lineTo(p.x + i * p.cw * 0.05, p.y + p.ch * 0.2);
            ctx.stroke();
          }
        } else if (l.typeId === "siphonophore") {
          ctx.strokeStyle = "#cfe7ff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x - p.cw * 0.24, p.y);
          ctx.quadraticCurveTo(p.x, p.y - p.ch * 0.1, p.x + p.cw * 0.24, p.y + p.ch * 0.04);
          ctx.stroke();
          ctx.fillStyle = "#e7f4ff";
          for (let i = 0; i < 4; i += 1) {
            ctx.beginPath();
            ctx.arc(p.x - p.cw * 0.2 + i * p.cw * 0.13, p.y + Math.sin(i + t / 500) * p.ch * 0.03, p.cw * 0.04, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (l.typeId === "fireflySquid") {
          ctx.fillStyle = "#f4ffff";
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.cw * 0.14, p.ch * 0.2, 0, 0, Math.PI * 2);
          ctx.fill();
          for (let i = 0; i < 6; i += 1) {
            const tx = p.x + (i - 2.5) * p.cw * 0.045;
            ctx.beginPath();
            ctx.moveTo(tx, p.y + p.ch * 0.08);
            ctx.lineTo(tx + Math.sin(t / 250 + i) * p.cw * 0.03, p.y + p.ch * 0.27);
            ctx.strokeStyle = "#dffaff";
            ctx.stroke();
          }
        } else {
          drawFishSilhouette(p.x, p.y, Math.min(p.cw, p.ch) * 0.42, 1, "#68c3ff", "#92d8ff");
        }

        if (gameState.ui.showGuides) {
          drawTag(def.name.toUpperCase(), p.x, p.y - p.ch * 0.5, { bg: "rgba(9, 26, 44, 0.86)", fg: "#cbebff", fs: 10 });
        }
      }
    }

    function drawHazards() {
      for (const hz of gameState.hazards) {
        const p = gridToPx(hz.x, hz.y);
        if (hz.type === "electricEel") {
          glow(p.x, p.y, Math.max(p.cw, p.ch) * 1.3, C.COLORS.EEL, 0.22);
          ctx.strokeStyle = "#d8ebff";
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i < 6; i += 1) {
            const tt = i / 5;
            const x = p.x - p.cw * 0.3 + tt * p.cw * 0.6;
            const y = p.y + Math.sin(gameState.elapsedMs / 180 + tt * 6) * p.ch * 0.12;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          if (gameState.ui.showGuides) drawTag("EEL", p.x, p.y - p.ch * 0.55, { bg: "rgba(28, 44, 62, 0.88)" });
        } else if (hz.type === "anglerfish") {
          glow(p.x, p.y, Math.max(p.cw, p.ch) * 1.8, C.COLORS.ANGLER, 0.22);
          drawFishSilhouette(p.x, p.y, Math.min(p.cw, p.ch) * 0.55, -1, "#6f8ba8", "#8ba6bf");
          ctx.strokeStyle = "#a5d8ff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x + p.cw * 0.05, p.y - p.ch * 0.08);
          ctx.lineTo(p.x + p.cw * 0.24, p.y - p.ch * 0.35);
          ctx.stroke();
          ctx.fillStyle = "#f1f7ff";
          ctx.beginPath();
          ctx.arc(p.x + p.cw * 0.24, p.y - p.ch * 0.35, p.cw * 0.05, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#e3f3ff";
          ctx.fillRect(p.x - p.cw * 0.24, p.y + p.ch * 0.03, p.cw * 0.12, p.ch * 0.03);
          if (gameState.ui.showGuides) drawTag("ANGLERFISH", p.x, p.y - p.ch * 0.55, { bg: "rgba(31, 42, 57, 0.9)" });
        } else {
          glow(p.x, p.y, Math.max(p.cw, p.ch) * 1.8, "#b9d8ff", 0.18);
          const spanPx = hz.span * p.cw * 0.3;
          for (let i = 0; i < 6; i += 1) {
            const tx = p.x - spanPx + (i / 5) * spanPx * 2;
            const ty = p.y + Math.sin(gameState.elapsedMs / 220 + i) * p.ch * 0.22;
            drawFishSilhouette(tx, ty, Math.min(p.cw, p.ch) * 0.18, Math.sin(gameState.elapsedMs / 450 + i), "#adc8e1", "#cadff2");
          }
          if (gameState.ui.showGuides) drawTag("SWARM", p.x, p.y - p.ch * 0.55, { bg: "rgba(30, 47, 68, 0.9)" });
        }
      }
    }

    function drawVisitors() {
      for (const v of gameState.visitors) {
        const p = gridToPx(v.x, v.y);
        if (v.type === "dolphin") {
          glow(p.x, p.y, Math.max(p.cw, p.ch) * 1.6, C.COLORS.DOLPHIN, 0.25);
          drawFishSilhouette(p.x, p.y, Math.min(p.cw, p.ch) * 0.58, 1, "#ebe9df", "#faf7ef");
          if (gameState.ui.showGuides) drawTag("DOLPHIN", p.x, p.y - p.ch * 0.52, { bg: "rgba(39, 51, 59, 0.9)", fg: "#f7f0e3" });
        } else {
          const size = v.species === "greatWhite" ? 0.9 : (v.species === "hammerhead" ? 0.72 : 0.65);
          glow(p.x, p.y, Math.max(p.cw, p.ch) * (v.species === "greatWhite" ? 2 : 1.6), "#b8c4cf", 0.18);
          drawFishSilhouette(p.x, p.y, Math.min(p.cw, p.ch) * size, v.dirX || 1, "#899cab", "#b9c8d4");
          if (v.species === "hammerhead") {
            ctx.fillStyle = "#95a9ba";
            ctx.fillRect(p.x + p.cw * 0.2, p.y - p.ch * 0.12, p.cw * 0.24, p.ch * 0.24);
          }
          if (v.species === "greatWhite") {
            ctx.fillStyle = "#deecf7";
            ctx.beginPath();
            ctx.moveTo(p.x + p.cw * 0.12, p.y + p.ch * 0.05);
            ctx.lineTo(p.x + p.cw * 0.32, p.y);
            ctx.lineTo(p.x + p.cw * 0.12, p.y - p.ch * 0.05);
            ctx.closePath();
            ctx.fill();
          }
          if (gameState.ui.showGuides) drawTag((v.species + " shark").toUpperCase(), p.x, p.y - p.ch * 0.58, { bg: "rgba(33, 40, 49, 0.9)" });
        }
      }
    }

    function drawDivers(alpha) {
      const cw = refs.canvas.width / C.GRID.COLS;
      const ch = refs.canvas.height / C.GRID.ROWS;
      for (const d of gameState.divers) {
        if (d.phase === "queued") continue;
        const toX = d.x;
        const toY = d.y;
        d.renderX += (toX - d.renderX) * Math.min(1, alpha + 0.4);
        d.renderY += (toY - d.renderY) * Math.min(1, alpha + 0.4);

        const p = gridToPx(d.renderX, d.renderY);
        glow(p.x, p.y, Math.max(cw, ch) * 0.9, "#8ec8ff", C.DIVER.PERSONAL_GLOW);
        drawDiverSilhouette(p.x, p.y, Math.min(cw, ch) * 0.75, d.dirX, d.dirY);

        const airRatio = clamp(d.air / C.DIVER.START_AIR, 0, 1);
        const barW = cw * 0.5;
        const barH = Math.max(4, ch * 0.08);
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(p.x - barW / 2, p.y - ch * 0.45, barW, barH);
        ctx.fillStyle = airRatio < (C.DIVER.CRIT_AIR / C.DIVER.START_AIR) ? "#ff6c7f" : "#6dd7ff";
        ctx.fillRect(p.x - barW / 2, p.y - ch * 0.45, barW * airRatio, barH);
        if (gameState.ui.showGuides) {
          drawTag("DIVER", p.x, p.y - ch * 0.58, { bg: "rgba(14, 34, 55, 0.9)", fg: "#d7ecff", fs: 10 });
        }

        if (d.status === "lost") {
          ctx.strokeStyle = "#ff6b87";
          ctx.beginPath();
          ctx.moveTo(p.x - 5, p.y - 5);
          ctx.lineTo(p.x + 5, p.y + 5);
          ctx.moveTo(p.x + 5, p.y - 5);
          ctx.lineTo(p.x - 5, p.y + 5);
          ctx.stroke();
        }
      }
    }

    function drawLegend() {
      if (!gameState.ui.showGuides || gameState.mode !== "playing") return;
      const x = 14;
      const y = 14;
      const w = 290;
      const h = 120;
      ctx.save();
      ctx.fillStyle = "rgba(6, 20, 34, 0.82)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(129, 188, 238, 0.45)";
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      ctx.fillStyle = "#d9edff";
      ctx.font = "700 12px Trebuchet MS";
      ctx.fillText("READING THE SCREEN", x + 10, y + 18);
      ctx.font = "11px Trebuchet MS";
      ctx.fillStyle = "#bdd8f5";
      ctx.fillText("DIVER = person to rescue", x + 10, y + 36);
      ctx.fillText("SUB EXIT = glowing safe circle", x + 10, y + 52);
      ctx.fillText("EEL / ANGLER / SWARM = hazards", x + 10, y + 68);
      ctx.fillText("DOLPHIN helps, SHARK disrupts", x + 10, y + 84);
      ctx.fillText("Use keys 1-5 or click slot, then click cave", x + 10, y + 100);
      ctx.restore();
    }

    function update(dtMs) {
      if (gameState.mode !== "playing") return;
      const dtSec = dtMs / 1000;
      gameState.tickMs = dtMs;
      gameState.elapsedMs += dtMs;

      updateHazards(dtSec);
      updateVisitors(dtSec);
      updateLights(dtMs);
      updateInventory(dtMs);
      updateDivers(dtSec);
      updateHud();
      finalizeLevel();
    }

    function render(alpha) {
      drawAmbient(gameState.elapsedMs);
      if (!gameState.level) return;
      drawWalls();
      drawExit();
      drawHazards();
      drawLights();
      drawVisitors();
      drawDivers(alpha);
      drawLegend();
    }

    function frame(ts) {
      let frameMs = ts - lastTs;
      lastTs = ts;
      frameMs = Math.min(frameMs, C.LOOP.MAX_FRAME_MS);
      accumulator += frameMs;

      while (accumulator >= C.LOOP.FIXED_MS) {
        update(C.LOOP.FIXED_MS);
        accumulator -= C.LOOP.FIXED_MS;
      }

      const alpha = accumulator / C.LOOP.FIXED_MS;
      render(alpha);
      rafId = requestAnimationFrame(frame);
    }

    function resizeCanvas() {
      const r = refs.wrap.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      refs.canvas.width = Math.max(320, Math.floor(r.width * ratio));
      refs.canvas.height = Math.max(180, Math.floor(r.height * ratio));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
      refs.canvas.width = Math.floor(r.width);
      refs.canvas.height = Math.floor(r.height);
    }

    function boot() {
      loadProgress();
      if (!gameState.storage.available) {
        refs.storageWarning.hidden = false;
      }
      refs.inventory.addEventListener("pointerdown", onInventoryPointer);
      refs.inventory.addEventListener("pointerup", onInventoryPointer);
      refs.inventory.addEventListener("mousedown", onInventoryPointer);
      refs.inventory.addEventListener("click", onInventoryPointer);
      window.addEventListener("keydown", onInventoryHotkey);
      refs.canvas.addEventListener("pointerdown", handleCanvasPointer);
      window.addEventListener("resize", resizeCanvas);
      resizeCanvas();
      setMode("mainMenu");
      lastTs = performance.now();
      rafId = requestAnimationFrame(frame);
    }

    boot();
