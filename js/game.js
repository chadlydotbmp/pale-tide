/* The Pale Tide — game state & rules (no build step) */
(function (global) {
  const STORAGE_KEY = 'pale-tide-v1';

  const BATCHES = {
    1: { name: 'Horde', emoji: '🧟', units: 'Hordes · hooded bodies · living hoods' },
    2: { name: 'Knights', emoji: '⚔️', units: 'Death knights · grave hounds' },
    3: { name: 'Wraiths', emoji: '👻', units: 'Ghosts · banshee' },
    4: { name: 'Reserves', emoji: '⋯', units: 'Spawns · reinforcements' },
    5: { name: 'Apex', emoji: '💀', units: 'Liches · Apostle' },
  };

  /** Slots indexed dead1..dead5; init counts fixed */
  const SLOT_INIT = { dead1: 10, dead2: 31, dead3: 16, dead4: 19, dead5: 25 };
  const SLOT_ORDER = ['dead2', 'dead5', 'dead4', 'dead3', 'dead1']; // high → low
  const LAIR_INIT = 20;

  const DEFAULT_ASSIGNMENT = { dead1: 1, dead2: 2, dead3: 3, dead4: 4, dead5: 5 };

  const PC_ROSTER = ['Anax', 'Kilgore', 'Acerian', 'Guts', 'Theo'];
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
    { min: 45, label: '0:45', hint: 'Gate open? · set G = round' },
    { min: 50, label: '0:50', hint: 'Phase 2 — The Ledger' },
    { min: 90, label: '1:30', hint: 'G+4 cone OR Ritual ≥ 10' },
    { min: 120, label: '2:00', hint: 'Break — 15 min' },
    { min: 135, label: '2:15', hint: 'Phase 3 — Apostle on mat' },
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
      pylonA: { shield: 100, stone: 90, destroyed: false },
      pylonB: { shield: 100, stone: 90, destroyed: false },
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
      rimRiteKnown: false,
      anchors: {
        north: { located: false, bound: false },
        east: { located: false, bound: false },
        skull: { located: false, bound: false },
      },
      apostleOnMat: false,
      apostleHp: 580,
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

  function rotateAssignment(assignment, steps) {
    const keys = ['dead1', 'dead2', 'dead3', 'dead4', 'dead5'];
    const batches = keys.map((k) => assignment[k]);
    const n = batches.length;
    const s = steps % n;
    const rotated = [...batches.slice(n - s), ...batches.slice(0, n - s)];
    const next = {};
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
    const d5 = Math.floor(Math.random() * 5) + 1;
    const sh = shuffle(d5);
    return {
      ...state,
      round: state.round + 1,
      fedHordesThisRound: 0,
      assignment:
        state.round === 1
          ? { ...DEFAULT_ASSIGNMENT }
          : rotateAssignment(state.assignment, d5 === 1 ? 0 : d5 - 1),
      shuffleRoll: state.round === 1 ? null : d5,
      pulseOn: false,
    };
  }

  function gTrack(state) {
    if (!state.gateOpen || state.gateRound == null) return null;
    return state.round - state.gateRound + 1;
  }

  function nextConeG(state) {
    const g = gTrack(state);
    if (g == null || g < 1) return null;
    if (g <= 4) return 4;
    return g % 2 === 0 ? g + 2 : g + 1;
  }

  function isConeRound(state) {
    const g = gTrack(state);
    return g != null && g >= 4 && (g - 4) % 2 === 0;
  }

  function resolveOrder(state) {
    const rows = SLOT_ORDER.map((slot) => ({
      slot,
      init: SLOT_INIT[slot],
      batch: state.assignment[slot],
      ...BATCHES[state.assignment[slot]],
    }));
    rows.splice(2, 0, {
      slot: 'lair',
      init: LAIR_INIT,
      batch: 0,
      name: 'Lair',
      emoji: '🌑',
      units: 'One lair · pylon regen',
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
      }));
    return [...rows, ...pcRows, ...summonRows].sort((a, b) => b.init - a.init);
  }

  function pylonAcBonus(state) {
    const a = !state.pylonA.destroyed && state.pylonA.stone > 0;
    const b = !state.pylonB.destroyed && state.pylonB.stone > 0;
    if (a && b) return 5;
    if (a || b) return 3;
    return 0;
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
        assignment: { ...base.assignment, ...(saved.assignment || {}) },
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
    gTrack,
    nextConeG,
    isConeRound,
    resolveOrder,
    pylonAcBonus,
    INNER_BUST_OPTIONS,
    load,
    save,
    reset,
  };
})(window);
