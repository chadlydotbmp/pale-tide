/* Initiative · LA · Lair reminders — L5 dial */
(function (global) {
  const BATCH_TURN = {
    1: {
      title: 'Horde',
      lines: [
        'One mob turn per horde · N→S',
        '5 attacks +5 each (+7 if Marshal within 30 ft)',
        'Pin horde: 2 attacks → Str DC 12',
        'Spawns enter at start of Horde slot',
        'Hood reveal at ≤2 bodies · Perception DC 12',
      ],
      la: null,
    },
    2: {
      title: 'Knights',
      lines: [
        '2 knights: Marshal → Heavy',
        'Multiattack: 2× Dread Blade +6',
        'Hellfire Orb Dex DC 13 · Mortuary Stillness Con DC 15',
        'Parry: +3 AC vs one melee hit',
      ],
      la: {
        budget: '1 headline LA/round across both knights',
        note: 'End of a PC turn',
        options: [
          'Move · Strike · Command',
          'Chill Command — Wis DC 13 or Charmed',
          'Mute the Song — Wis DC 13 or disadv next spell (Chung-Hin / Wizard / Andrew)',
          'Ledger’s Pin — Str DC 13 or Restrained',
        ],
      },
    },
    3: {
      title: 'Wraiths',
      lines: [
        '5 ghosts · Life Drain +6 · 3d8+3 nec',
        'Banshee Phase 3 · friendly → neutral',
        'Peel concentrating casters (Chung-Hin · Wizard · Andrew)',
      ],
      la: {
        budget: 'Banshee 1/round · hostile only',
        options: [
          'Drift · Touch · Keening Wis DC 13',
        ],
      },
    },
    4: {
      title: 'Hunters',
      lines: [
        'Living hoods · grave hounds',
        'Hound: bite +6 ×2 · Cold Howl Wis DC 13',
        'Hood: +7 dagger×2 · targets exposed gate PC',
      ],
      la: null,
    },
    5: {
      title: 'Apex',
      lines: [
        'Lichens 1 LA/round each · Apostle 2 LA (3 bloodied)',
        'Apostle HP 110 premature · 140 if Ritual 20',
      ],
      la: {
        budget: 'One headline across liches + Apostle',
        sections: [
          {
            name: 'Leader Lich',
            options: ['Ray of Frost · Frightening Gaze Wis DC 13 · Teleport'],
          },
          {
            name: 'Keeper Lich',
            options: ['Chill Touch · Ledger’s Tally Con DC 14'],
          },
          {
            name: 'Apostle',
            options: [
              'Swipe · Finger of Death Con DC 14 · Stare Con DC 13',
              'Wheel rotates damage types — fixed immune cold/nec/poison',
            ],
          },
        ],
      },
    },
  };

  const LAIR = {
    init: 20,
    title: 'Lair · init 20',
    pickOne: 'Pick ONE lair action per round',
    extras: [
      'Optional — pick ONE lair action per round',
    ],
    actions: [
      {
        name: 'Stillness Between Heartbeats',
        effect: 'One creature in 60 ft',
        save: 'Con 15 or can’t regain HP until end of next turn',
      },
      {
        name: 'Grave Fog',
        effect: 'Two 15-ft spheres obscured',
        save: 'Con 13 or 2d6 nec',
      },
      { name: 'Negative Pulse', effect: 'Disadv Mortuary Stillness saves', save: '—' },
      {
        name: 'Clutch of the Fallen',
        effect: 'On desecrated ground',
        save: 'Str 13 or Restrained (escape 13)',
      },
    ],
  };

  const INIT_COUNTS = [
    { init: 21, slot: 'Dead 2', home: 'Knights' },
    { init: 20, slot: 'Dead 5', home: 'Apex' },
    { init: 20, slot: 'Lair', home: 'Lair action' },
    { init: 15, slot: 'Dead 4', home: 'Hunters' },
    { init: 10, slot: 'Dead 3', home: 'Ghosts' },
    { init: 5, slot: 'Dead 1', home: 'Horde' },
  ];

  function reminderForSlot(state, slot) {
    if (slot.startsWith('pc:')) {
      const id = slot.slice(3);
      const pc = (state.pcs || []).find((p) => p.id === id);
      if (!pc) return null;
      return {
        type: 'pc',
        title: pc.name,
        init: pc.init,
        lines: ['Player turn · enemy LA resolve end of this turn'],
      };
    }
    if (slot.startsWith('summon:')) {
      const id = slot.slice(7);
      const summon = (state.summons || []).find((s) => s.id === id);
      if (!summon) return null;
      return {
        type: 'summon',
        title: summon.name,
        init: summon.init,
        lines: ['Steel Defender / summon acts on this initiative'],
      };
    }
    if (slot === 'lair') return { type: 'lair', ...LAIR };
    const batch = state.assignment[slot];
    if (!batch) return null;
    return { type: 'batch', batch, ...BATCH_TURN[batch] };
  }

  function reminderForBatch(batch) {
    return BATCH_TURN[batch] || null;
  }

  global.PaleTideReminders = {
    BATCH_TURN,
    LAIR,
    INIT_COUNTS,
    reminderForSlot,
    reminderForBatch,
  };
})(window);
