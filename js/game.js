/* The Pale Tide — game state & rules (no build step) */
(function (global) {
  const STORAGE_KEY = 'pale-tide-v1';

  const BATCHES = {
    1: { name: 'Horde', emoji: '🧟', units: 'Hordes · hooded bodies' },
    2: { name: 'Knights', emoji: '⚔️', units: 'Death knights' },
    3: { name: 'Wraiths', emoji: '👻', units: 'Ghosts · banshee' },
    4: { name: 'Hunters', emoji: '🐕', units: 'Living hoods · hounds' },
    5: { name: 'Apex', emoji: '💀', units: 'Liches · Apostle' },
  };

  /** Slots indexed dead1..dead5; init counts fixed */
  const SLOT_INIT = { dead1: 10, dead2: 31, dead3: 16, dead4: 19, dead5: 25 };
  const SLOT_ORDER = ['dead2', 'dead5', 'dead4', 'dead3', 'dead1']; // high → low
  const LAIR_INIT = 20;

  const DEFAULT_ASSIGNMENT = { dead1: 1, dead2: 2, dead3: 3, dead4: 4, dead5: 5 };

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

  function defaultState() {
    return {
      phase: 1,
      round: 1,
      gateRound: null,
      gateOpen: false,
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
      womanFriendly: false,
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
      apostleWheel: ['', '', ''],
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
    return rows.sort((a, b) => b.init - a.init);
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
        apostleWheel: Array.isArray(saved.apostleWheel) ? saved.apostleWheel : base.apostleWheel,
        timerFired: Array.isArray(saved.timerFired) ? saved.timerFired : base.timerFired,
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

  global.PaleTide = {
    BATCHES,
    SLOT_INIT,
    SLOT_ORDER,
    LAIR_INIT,
    DEFAULT_ASSIGNMENT,
    TIME_MARKERS,
    timerElapsedMs,
    timerSegment,
    timerNextMarker,
    defaultState,
    rotateAssignment,
    shuffle,
    nextRound,
    gTrack,
    nextConeG,
    isConeRound,
    resolveOrder,
    pylonAcBonus,
    load,
    save,
    reset,
  };
})(window);
