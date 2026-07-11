/* Ghoulsburg Cemetery — game state & rules (no build step) */
(function (global) {
  const STORAGE_KEY = 'pale-tide-v1';

  const BATCHES = {
    1: { name: 'Horde', emoji: '🧟', units: 'Hordes · hooded bodies' },
    2: { name: 'Knights', emoji: '⚔️', units: '2 Death knights' },
    3: { name: 'Wraiths', emoji: '👻', units: '5 Ghosts · banshee' },
    4: { name: 'Hunters', emoji: '🐕', units: 'Living hoods · grave hounds' },
    5: { name: 'Apex', emoji: '💀', units: 'Liches · Apostle' },
  };

  /** Slots indexed dead1..dead5; init counts fixed */
  const SLOT_INIT = { dead1: 5, dead2: 21, dead3: 10, dead4: 15, dead5: 20 };
  const SLOT_ORDER = ['dead2', 'dead5', 'dead4', 'dead3', 'dead1']; // high → low
  const LAIR_INIT = 20;

  const DEFAULT_ASSIGNMENT = { dead1: 1, dead2: 2, dead3: 3, dead4: 4, dead5: 5 };

  const SKULL_PILE_COUNT = 10;
  const ANCESTOR_COUNT = 3;
  /** Bloodline gaps on the table — piles 3, 6, 9 (some line the road to the gate) */
  const ANCESTOR_PILE_NUMBERS = [3, 6, 9];
  /** Fixed rim sites — which pile directs where is shuffled each encounter */
  const CONSECRATION_SITES = [
    { id: 'north', label: 'North row', tag: 'N' },
    { id: 'east', label: 'East row', tag: 'E' },
    { id: 'skull', label: 'Skull pits', tag: 'S' },
  ];

  function randomPileSiteMap() {
    const siteIds = CONSECRATION_SITES.map((s) => s.id);
    const shuffled = siteIds.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const map = {};
    ANCESTOR_PILE_NUMBERS.forEach((pile, i) => {
      map[pile] = shuffled[i];
    });
    return map;
  }

  function normalizePileSiteMap(saved) {
    if (!saved || typeof saved !== 'object') return randomPileSiteMap();
    const siteIds = CONSECRATION_SITES.map((s) => s.id);
    const used = new Set();
    const map = {};
    let ok = true;
    ANCESTOR_PILE_NUMBERS.forEach((pile) => {
      const id = saved[pile] ?? saved[String(pile)];
      if (!siteIds.includes(id) || used.has(id)) {
        ok = false;
        return;
      }
      used.add(id);
      map[pile] = id;
    });
    if (!ok || used.size !== ANCESTOR_COUNT) return randomPileSiteMap();
    return map;
  }

  function defaultSkullPiles() {
    return Array.from({ length: SKULL_PILE_COUNT }, (_, i) => ({
      num: i + 1,
      searched: false,
      found: false,
    }));
  }

  function normalizeSkullPiles(saved) {
    const base = defaultSkullPiles();
    if (!Array.isArray(saved)) return base;
    return base.map((b) => {
      const s = saved.find((x) => x.num === b.num);
      if (!s) return b;
      return {
        ...b,
        searched: !!s.searched,
        found: !!s.found || !!s.consecrated,
      };
    });
  }

  function pileConsecrationSite(pileNum, pileSiteMap) {
    if (!ANCESTOR_PILE_NUMBERS.includes(pileNum)) return null;
    const id = pileSiteMap[pileNum];
    if (!id) return null;
    return CONSECRATION_SITES.find((s) => s.id === id) || null;
  }

  function pileForSite(siteId, pileSiteMap) {
    return ANCESTOR_PILE_NUMBERS.find((p) => pileSiteMap[p] === siteId) ?? null;
  }

  function countAnchorBinds(anchors) {
    return CONSECRATION_SITES.filter((s) => anchors[s.id].bound).length;
  }

  const APOSTLE_HP_BASE = 110;
  const APOSTLE_HP_RITUAL_COMPLETE = 140;
  const PYLON_STONE_MAX = 35;
  const RIM_ALL_SITES_RITUAL_DROP = 5;

  function apostleMaxHp(ritualAtArrival) {
    return ritualAtArrival >= 20 ? APOSTLE_HP_RITUAL_COMPLETE : APOSTLE_HP_BASE;
  }

  function apostleBloodiedThreshold(maxHp) {
    return Math.floor(maxHp / 2);
  }

  function applyAllSitesConsecrationBonus(before, after) {
    const wasComplete = !!before.allSitesConsecrated;
    const nowComplete = countAnchorBinds(after.anchors) === ANCESTOR_COUNT;
    let ritual = after.ritual;
    let allSitesConsecrated = wasComplete;
    let ritualStopped = after.ritualStopped ?? before.ritualStopped;

    if (nowComplete && !wasComplete) {
      ritual = Math.max(0, ritual - RIM_ALL_SITES_RITUAL_DROP);
      allSitesConsecrated = true;
      ritualStopped = true;
    } else if (!nowComplete && wasComplete) {
      ritual = Math.min(20, ritual + RIM_ALL_SITES_RITUAL_DROP);
      allSitesConsecrated = false;
      if (!before.apostleOnMat) {
        ritualStopped = false;
      }
    }

    return { ritual, allSitesConsecrated, ritualStopped };
  }

  function apostleArrivalPatch(next) {
    const ritualAtArrival = next.ritual;
    const permanent = ritualAtArrival >= 20;
    const maxHp = apostleMaxHp(ritualAtArrival);
    return {
      ...next,
      phase: 3,
      apostleOnMat: true,
      ritualStopped: true,
      ritual: permanent ? 20 : next.ritual,
      apostleManifestation: permanent ? 'permanent' : 'premature',
      apostleMaxHp: maxHp,
      apostleHp: maxHp,
      apostleBloodied: false,
      activeTab: 'phase3',
    };
  }

  function skullAncestorsFound(skullPiles) {
    return ANCESTOR_PILE_NUMBERS.filter((n) => {
      const p = skullPiles.find((x) => x.num === n);
      return p && p.found;
    }).length;
  }

  function advanceSkullPile(piles, pileNum, pileSiteMap) {
    const next = piles.map((p) => ({ ...p }));
    const p = next[pileNum - 1];
    if (!p) return { piles: next, newlyFoundSite: null };
    const site = pileConsecrationSite(pileNum, pileSiteMap);
    let newlyFoundSite = null;
    if (site) {
      if (!p.found) {
        p.found = true;
        newlyFoundSite = site;
      }
    } else if (!p.searched) {
      p.searched = true;
    }
    return { piles: next, newlyFoundSite };
  }

  const PC_ROSTER = ['Chung-Hin', 'Si Yuan', 'Edwin', 'Andrew', 'Wizard'];
  const SUMMON_ROSTER = ['Summon 1', 'Summon 2', 'Summon 3'];

  function defaultPcs() {
    return PC_ROSTER.map((name, i) => ({
      id: `pc${i + 1}`,
      name,
      init: null,
      inTracker: false,
    }));
  }

  function defaultSummons() {
    return SUMMON_ROSTER.map((name, i) => ({
      id: `summon${i + 1}`,
      name,
      init: null,
      inTracker: false,
    }));
  }

  function normalizePcs(saved) {
    const base = defaultPcs();
    if (!Array.isArray(saved)) return base;
    return base.map((b) => {
      const s = saved.find((x) => x.id === b.id);
      if (!s) return b;
      const init = s.init != null && s.init !== '' ? Number(s.init) : null;
      return {
        ...b,
        init: Number.isFinite(init) ? init : null,
        inTracker: !!s.inTracker,
      };
    });
  }

  function normalizeSummons(saved) {
    const base = defaultSummons();
    if (!Array.isArray(saved)) return base;
    return base.map((b) => {
      const s = saved.find((x) => x.id === b.id);
      if (!s) return b;
      const init = s.init != null && s.init !== '' ? Number(s.init) : null;
      return {
        ...b,
        init: Number.isFinite(init) ? init : null,
        inTracker: !!s.inTracker,
      };
    });
  }

  /** Wall-clock spine — SESSION_RUNDOWN.md */
  const TIME_MARKERS = [
    { min: 0, label: '0:00', hint: 'Teleport · cold open' },
    { min: 5, label: '0:05', hint: 'R1 — split Gate · Lane' },
    { min: 45, label: '0:45', hint: 'Gate open? · Outer / Inner split' },
    { min: 50, label: '0:50', hint: 'Act II — Count' },
    { min: 90, label: '1:30', hint: 'R+4 cone OR Ritual ~8' },
    { min: 120, label: '2:00', hint: 'Break — 15 min' },
    { min: 135, label: '2:15', hint: 'Act III — Apostle on mat' },
    { min: 195, label: '3:15', hint: 'Dismissal OR Apostle bloodied' },
    { min: 225, label: '3:45', hint: 'Hard stop · wrap' },
  ];

  /** Apostle rotating immunities — ENEMY_STAT_BLOCKS.md */
  const WHEEL_TYPES = [
    { id: 'acid', label: 'Acid' },
    { id: 'fire', label: 'Fire' },
    { id: 'force', label: 'Force' },
    { id: 'lightning', label: 'Lightning' },
    { id: 'physical', label: 'Physical (B/P/S)' },
    { id: 'psychic', label: 'Psychic' },
    { id: 'radiant', label: 'Radiant' },
    { id: 'thunder', label: 'Thunder' },
  ];

  const WHEEL_TYPE_IDS = WHEEL_TYPES.map((t) => t.id);

  function normalizeApostleWheel(wheel) {
    if (!Array.isArray(wheel)) return [];
    const out = [];
    wheel.forEach((entry) => {
      const id = String(entry || '')
        .toLowerCase()
        .trim();
      if (!WHEEL_TYPE_IDS.includes(id) || out.includes(id)) return;
      out.push(id);
    });
    return out.slice(0, 3);
  }

  function wheelLabel(id) {
    const t = WHEEL_TYPES.find((x) => x.id === id);
    return t ? t.label : id;
  }

  function defaultPhase1Collapsed() {
    return {
      gate: false,
      fronts: false,
      afterOpen: false,
      eor: false,
    };
  }

  function defaultPhase2Collapsed() {
    return {
      pylons: false,
      sanctum: false,
      inner: false,
      sanctumTable: false,
      grave: false,
      anchors: false,
      phase3: false,
      fronts: false,
    };
  }

  function defaultPhase3Collapsed() {
    return {
      timeCollapse: false,
      apostle: false,
      dismissal: false,
      spawns: false,
    };
  }

  function defaultState() {
    return {
      phase: 1,
      round: 1,
      gateRound: null,
      gateOpen: false,
      gateLock1: false,
      gateLock2: false,
      gateLock1Unpickable: false,
      gateLock2Unpickable: false,
      gateToolsBroken: false,
      gatePickStarted: false,
      gateSmashSuccesses: 0,
      gateSmashed: false,
      gateHeld: false,
      pulseOn: false,
      ritual: 0,
      ritualStopped: false,
      breach: 0,
      fedHordesThisRound: 0,
      assignment: { ...DEFAULT_ASSIGNMENT },
      shuffleRoll: null,
      pylonA: { shield: 0, stone: PYLON_STONE_MAX, destroyed: false },
      pylonB: { shield: 0, stone: PYLON_STONE_MAX, destroyed: false },
      graveChurn: 25,
      graveTiers: { t25: true, t50: false, t75: false, t100: false },
      innerWins: 0,
      innerFails: 0,
      innerBuydowns: 0,
      innerBustPending: false,
      innerBustChoice: null,
      innerOpposedBonus: 0,
      womanDisposition: 'neutral',
      childrenRemoved: 0,
      normanFound: false,
      countingHousePassed: false,
      rimRiteKnown: false,
      pileSiteMap: randomPileSiteMap(),
      skullPiles: defaultSkullPiles(),
      skullTargetsRevealed: false,
      anchors: {
        north: { located: false, bound: false },
        east: { located: false, bound: false },
        skull: { located: false, bound: false },
      },
      allSitesConsecrated: false,
      apostleOnMat: false,
      apostleManifestation: null,
      apostleHp: APOSTLE_HP_BASE,
      apostleMaxHp: APOSTLE_HP_BASE,
      apostleLr: 3,
      apostleBloodied: false,
      apostleWheel: [],
      sessionStart: Date.now(),
      timerPaused: false,
      timerPauseStart: null,
      timerPauseTotal: 0,
      timerFired: [],
      timerAlert: null,
      breakTaken: false,
      activeTab: 'phase1',
      monsterFilter: 'all',
      monsterOpen: null,
      turnHighlight: null,
      lairPick: null,
      laKnightsUsed: 0,
      laApostleUsed: 0,
      pcs: defaultPcs(),
      alliesInitCollapsed: false,
      summons: defaultSummons(),
      phase2Collapsed: defaultPhase2Collapsed(),
      phase1Collapsed: defaultPhase1Collapsed(),
      phase3Collapsed: defaultPhase3Collapsed(),
    };
  }

  /** Horde (batch 1) is fixed at dead1 / init 5; shuffle rotates batches 2–5 only */
  function rotateAssignment(assignment, steps) {
    const keys = ['dead2', 'dead3', 'dead4', 'dead5'];
    const batches = keys.map((k) => assignment[k]);
    const n = batches.length;
    const s = steps % n;
    const rotated = [...batches.slice(n - s), ...batches.slice(0, n - s)];
    const next = { dead1: 1 };
    keys.forEach((k, i) => {
      next[k] = rotated[i];
    });
    return next;
  }

  function shuffle(d5) {
    const steps = d5 === 1 ? 0 : d5 - 1;
    return { assignment: rotateAssignment(DEFAULT_ASSIGNMENT, steps), shuffleRoll: d5 };
  }

  function nextRound(state) {
    return {
      ...state,
      round: state.round + 1,
      fedHordesThisRound: 0,
      assignment: { ...DEFAULT_ASSIGNMENT },
      shuffleRoll: null,
      pulseOn: false,
      turnHighlight: null,
      lairPick: null,
      laKnightsUsed: 0,
      laApostleUsed: 0,
    };
  }

  function gTrack(state) {
    if (!state.gateOpen || state.gateRound == null) return null;
    return state.round - state.gateRound + 1;
  }

  /** R+2 wail · R+4 & R+7 cones (rounds after gate opened) */
  function isWailRound(state) {
    const g = gTrack(state);
    return g === 2;
  }

  function isConeRound(state) {
    const g = gTrack(state);
    return g === 4 || g === 7;
  }

  function nextPylonBeat(state) {
    const g = gTrack(state);
    if (g == null) return null;
    if (g < 2) return { at: 2, kind: 'wail' };
    if (g < 4) return { at: 4, kind: 'cone' };
    if (g < 7) return { at: 7, kind: 'cone' };
    return null;
  }

  function nextConeG(state) {
    const beat = nextPylonBeat(state);
    return beat && beat.kind === 'cone' ? beat.at : null;
  }

  function batchActiveInPhase(batch, phase) {
    if (batch === 3) return phase >= 2;
    if (batch === 5) return phase >= 3;
    return true;
  }

  function batchUnitsLabel(batch, phase) {
    const b = BATCHES[batch];
    if (!b) return '';
    if (!batchActiveInPhase(batch, phase)) {
      if (batch === 3) return 'Not in init until Ph 2 · ghosts · banshee Ph 3';
      if (batch === 5) return 'Not in init until Ph 3 · liches · Apostle';
    }
    return b.units;
  }

  function resolveOrder(state) {
    const phase = state.phase || 1;
    const rows = SLOT_ORDER.map((slot) => ({
      slot,
      init: SLOT_INIT[slot],
      batch: state.assignment[slot],
      ...BATCHES[state.assignment[slot]],
      units: batchUnitsLabel(state.assignment[slot], phase),
      active: batchActiveInPhase(state.assignment[slot], phase),
    }));
    rows.splice(2, 0, {
      slot: 'lair',
      init: LAIR_INIT,
      batch: 0,
      name: 'Lair',
      emoji: '🌑',
      units: 'One lair · pylon regen',
      active: true,
    });
    const pcRows = (state.pcs || [])
      .filter((pc) => pc.inTracker && pc.init != null)
      .map((pc) => ({
        slot: `pc:${pc.id}`,
        init: pc.init,
        batch: null,
        name: pc.name,
        emoji: '🎲',
        units: 'Player',
        isPc: true,
        active: true,
      }));
    const summonRows = (state.summons || [])
      .filter((s) => s.inTracker && s.init != null)
      .map((s) => ({
        slot: `summon:${s.id}`,
        init: s.init,
        batch: null,
        name: s.name,
        emoji: '✨',
        units: 'Summoned',
        isSummon: true,
        active: true,
      }));
    return [...rows, ...pcRows, ...summonRows].sort((a, b) => b.init - a.init);
  }

  function pylonAcBonus(state) {
    const a = !state.pylonA.destroyed && state.pylonA.stone > 0;
    const b = !state.pylonB.destroyed && state.pylonB.stone > 0;
    if (a && b) return 2;
    if (a || b) return 1;
    return 0;
  }

  /** Ritual 20 → Apostle on mat */
  function mergeStatePatch(current, patch) {
    let next = { ...current, ...patch };

    if (patch.anchors) {
      const bonus = applyAllSitesConsecrationBonus(current, next);
      next = { ...next, ...bonus };
    }

    const wasOnMat = current.apostleOnMat;
    const autoArrival = !wasOnMat && next.ritual >= 20;
    const manualArrival = !wasOnMat && patch.apostleOnMat;

    if (autoArrival || manualArrival) {
      return apostleArrivalPatch(next);
    }

    return next;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const saved = JSON.parse(raw);
      const base = defaultState();
      if (saved.activeTab === 'combat') saved.activeTab = 'phase1';
      if (saved.activeTab === 'pylons' || saved.activeTab === 'sanctum') saved.activeTab = 'phase2';
      if (saved.activeTab === 'apostle') saved.activeTab = 'phase3';
      return {
        ...base,
        ...saved,
        assignment: { ...base.assignment, ...(saved.assignment || {}), dead1: 1 },
        pylonA: { ...base.pylonA, ...(saved.pylonA || {}) },
        pylonB: { ...base.pylonB, ...(saved.pylonB || {}) },
        graveTiers: { ...base.graveTiers, ...(saved.graveTiers || {}) },
        anchors: {
          north: { ...base.anchors.north, ...((saved.anchors && saved.anchors.north) || {}) },
          east: { ...base.anchors.east, ...((saved.anchors && saved.anchors.east) || {}) },
          skull: { ...base.anchors.skull, ...((saved.anchors && saved.anchors.skull) || {}) },
        },
        apostleWheel: normalizeApostleWheel(saved.apostleWheel),
        timerFired: Array.isArray(saved.timerFired) ? saved.timerFired : base.timerFired,
        gatePickStarted:
          saved.gatePickStarted ??
          !!(saved.gateLock1 || saved.gateLock2 || saved.gateMethod === 'pick' || saved.gateToolsBroken),
        gateSmashSuccesses:
          saved.gateSmashSuccesses ?? (saved.gateSmashed ? 3 : 0),
        womanDisposition: (() => {
          const d = saved.womanDisposition;
          if (d === 'friendly' || d === 'neutral' || d === 'hostile') return d;
          if (saved.womanFriendly) return 'friendly';
          return 'neutral';
        })(),
        childrenRemoved: saved.childrenRemoved ?? 0,
        normanFound: saved.normanFound ?? false,
        countingHousePassed: saved.countingHousePassed ?? false,
        pcs: normalizePcs(saved.pcs),
        alliesInitCollapsed:
          saved.alliesInitCollapsed ??
          (saved.pcInitCollapsed && saved.summonInitCollapsed) ??
          saved.pcInitCollapsed ??
          false,
        summons: normalizeSummons(saved.summons),
        phase2Collapsed: {
          ...defaultPhase2Collapsed(),
          ...(saved.phase2Collapsed || {}),
        },
        phase1Collapsed: {
          ...defaultPhase1Collapsed(),
          ...(saved.phase1Collapsed || {}),
        },
        phase3Collapsed: {
          ...defaultPhase3Collapsed(),
          ...(saved.phase3Collapsed || {}),
        },
        innerBustPending: saved.innerBustPending ?? false,
        innerBustChoice: saved.innerBustChoice ?? null,
        innerOpposedBonus: saved.innerOpposedBonus ?? 0,
        pileSiteMap: normalizePileSiteMap(saved.pileSiteMap),
        skullPiles: normalizeSkullPiles(saved.skullPiles),
        skullTargetsRevealed: saved.skullTargetsRevealed ?? false,
        allSitesConsecrated:
          saved.allSitesConsecrated ??
          countAnchorBinds({ ...base.anchors, ...(saved.anchors || {}) }) === ANCESTOR_COUNT,
        apostleMaxHp: saved.apostleMaxHp ?? saved.apostleHp ?? APOSTLE_HP_BASE,
        apostleManifestation:
          saved.apostleManifestation ??
          (saved.apostleOnMat
            ? (saved.apostleMaxHp ?? saved.apostleHp ?? APOSTLE_HP_BASE) >= APOSTLE_HP_RITUAL_COMPLETE
              ? 'permanent'
              : 'premature'
            : null),
      };
    } catch (e) {
      return defaultState();
    }
  }

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    return defaultState();
  }

  function timerElapsedMs(state, now) {
    const t = now == null ? Date.now() : now;
    if (state.timerPaused && state.timerPauseStart) {
      return state.timerPauseStart - state.sessionStart - state.timerPauseTotal;
    }
    return t - state.sessionStart - state.timerPauseTotal;
  }

  function timerSegment(elapsedMin) {
    let seg = TIME_MARKERS[0];
    for (let i = 0; i < TIME_MARKERS.length; i++) {
      if (elapsedMin >= TIME_MARKERS[i].min) seg = TIME_MARKERS[i];
    }
    return seg;
  }

  function timerNextMarker(elapsedMin) {
    return TIME_MARKERS.find((m) => m.min > elapsedMin) || null;
  }

  const INNER_BUST_OPTIONS = [
    {
      id: 'ready',
      title: 'Count finishes early',
      effect: 'Ritual +1 — the mistake pulls the finale forward before the party is ready.',
    },
    {
      id: 'ledger',
      title: 'Ledger locks in',
      effect: 'Ritual +1 · +2 DC on next inner checks — failure filed in the count.',
    },
    {
      id: 'collapse',
      title: 'Time bleeds backward',
      effect: 'Ritual +1 · Phase 3 leaks early (Null Pulse flicker · slot/HP drain Inside).',
    },
    {
      id: 'fuel',
      title: 'Banishment feeds the vortex',
      effect: 'Ritual +1 — the ejection fuels what is coming through the crypt.',
    },
    {
      id: 'inventory',
      title: "Myrkul's inventory",
      effect: 'Breach +1 — the cemetery answers on the Outer front.',
    },
  ];

  global.PaleTide = {
    BATCHES,
    SLOT_INIT,
    SLOT_ORDER,
    LAIR_INIT,
    DEFAULT_ASSIGNMENT,
    TIME_MARKERS,
    WHEEL_TYPES,
    normalizeApostleWheel,
    wheelLabel,
    timerElapsedMs,
    timerSegment,
    timerNextMarker,
    defaultPcs,
    normalizePcs,
    PC_ROSTER,
    defaultSummons,
    normalizeSummons,
    SUMMON_ROSTER,
    defaultState,
    defaultPhase1Collapsed,
    defaultPhase2Collapsed,
    defaultPhase3Collapsed,
    rotateAssignment,
    shuffle,
    nextRound,
    PYLON_STONE_MAX,
    gTrack,
    isWailRound,
    nextPylonBeat,
    nextConeG,
    isConeRound,
    resolveOrder,
    batchActiveInPhase,
    batchUnitsLabel,
    pylonAcBonus,
    mergeStatePatch,
    SKULL_PILE_COUNT,
    ANCESTOR_COUNT,
    ANCESTOR_PILE_NUMBERS,
    CONSECRATION_SITES,
    randomPileSiteMap,
    defaultSkullPiles,
    pileConsecrationSite,
    pileForSite,
    APOSTLE_HP_BASE,
    APOSTLE_HP_RITUAL_COMPLETE,
    apostleMaxHp,
    apostleBloodiedThreshold,
    applyAllSitesConsecrationBonus,
    apostleArrivalPatch,
    countAnchorBinds,
    skullAncestorsFound,
    advanceSkullPile,
    INNER_BUST_OPTIONS,
    load,
    save,
    reset,
  };
})(window);
