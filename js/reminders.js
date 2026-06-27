/* Initiative · LA · Lair reminders — from ENEMY_STAT_BLOCKS.md */
(function (global) {
  const BATCH_TURN = {
    1: {
      title: 'Horde',
      lines: [
        'One mob turn per horde · N→S',
        '5 attacks +8 each (+10 if Marshal within 30 ft)',
        'Pin horde: 2 attacks → Str DC 16 grapple',
        'Spawns enter at start of Horde slot this round',
        'Hood reveal at ≤2 bodies · end of Horde slot',
        'Living hoods: +10 dagger×2 · venom Con 19 · Fade bonus',
      ],
      la: null,
    },
    2: {
      title: 'Knights',
      lines: [
        'Turn order: Marshal → Heavy → Blade Singer → hounds',
        'Multiattack: 3× Dread Blade +11',
        'Hellfire Orb · Mortuary Stillness Con 23 (recharge 5–6)',
        'Parry reaction: +6 AC vs one melee hit',
        'Grave hounds: bite +11 ×2 · Cold Howl Wis 19 · Pack Takedown',
      ],
      la: {
        budget: '2/round · Blade Singer 3/round',
        note: 'End of a PC turn · one headline suppression per round',
        options: [
          'Move — half speed, no OA',
          'Strike — +12 longsword 2d8+6 + 2d6 nec',
          'Command — one cluster half speed',
          'Chill Command — Wis 21 or Charmed (non-Raging)',
          'Bone Litany — Wis 21 or can’t extend Rage',
          'Crown’s Weight — Wis 21 or auras off (Anax)',
          'Skull Weight — Wis 21 or no psychic (Theokoles)',
          'Blade Burst — Blade Singer only · 30-ft line 8d8 force Dex 18 half',
        ],
      },
    },
    3: {
      title: 'Wraiths',
      lines: [
        'Ghosts N→S · then banshee if Phase 3',
        'Life Drain +10 · 5d8+6 nec · max HP − damage',
        'Soul Grit: 4 wraiths on one target or crit → Con 23 or Rage ends',
        'Banshee friendly only → neutral · attacks if neutral or worse',
      ],
      la: {
        budget: 'Banshee 2/round · hostile if neutral or worse',
        note: 'End of another creature’s turn',
        options: [
          'Drift — fly half speed',
          'Touch — Corrupting Touch +10',
          'Keening — Wis 20 or Frightened',
          'Still Counting — Wis 21 or no healing until her next turn',
        ],
      },
    },
    4: {
      title: 'Reserves',
      lines: [
        'Grave spawns / reinforcements when this batch is active',
        'Living hoods → Horde · hounds → Knights',
      ],
      la: null,
    },
    5: {
      title: 'Apex',
      lines: [
        'Leader Lich → Keeper Lich → Apostle last',
        'Lichens: 2 LA/round each · LR 2/day',
        'Apostle: 3 LA/round · 4 when bloodied ≤290',
      ],
      la: {
        budget: 'See active unit below',
        sections: [
          {
            name: 'Leader Lich (2/round)',
            options: [
              'Cantrip — Ray of Frost',
              'Frightening Gaze — Wis 20',
              'Teleport — 60 ft',
              'Bone Litany — Wis 21 vs Raging',
            ],
          },
          {
            name: 'Keeper Lich (2/round)',
            options: [
              'Cantrip — Chill Touch',
              'Frightening Gaze — Wis 21',
              'Teleport — 60 ft',
              'Ledger’s Tally — Con 21 or conc save at disadv',
            ],
          },
          {
            name: 'Apostle (3/round · 4 bloodied)',
            options: [
              '1 · Swipe — Scythe attack',
              '2 · Finger of Death — Empowered only · DC 21 · 7d8+30 nec',
              '3 · Stare of Mortality — Con 20 or +1 Exhaustion',
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
      'Each intact pylon: +d100 shield HP (max 100)',
      'Phase 3: Apostle +30 HP if any pylon intact',
      'PULSE turns off after lair (if pulsing)',
    ],
    actions: [
      {
        name: 'Stillness Between Heartbeats',
        effect: 'One Raging creature in 60 ft',
        save: 'Con 23 or Rage ends · undead heal 2d6',
      },
      {
        name: 'Grave Fog',
        effect: 'Two 15-ft spheres heavily obscured until next init 20',
        save: 'Start turn inside: Con 21 or 4d6 nec',
      },
      {
        name: 'Negative Pulse',
        effect: 'Raging creatures disadv on Mortuary Stillness saves this round',
        save: '—',
      },
      {
        name: 'Clutch of the Fallen',
        effect: 'One creature on desecrated ground',
        save: 'Str 21 or Restrained (escape 21) · no dmg before turn end → Rage ends',
      },
    ],
  };

  const INIT_COUNTS = [
    { init: 31, slot: 'Dead 2', home: 'Knights' },
    { init: 25, slot: 'Dead 5', home: 'Apex' },
    { init: 20, slot: 'Lair', home: 'Lair action' },
    { init: 19, slot: 'Dead 4', home: 'Reserves' },
    { init: 16, slot: 'Dead 3', home: 'Wraiths' },
    { init: 10, slot: 'Dead 1', home: 'Horde' },
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
        lines: ['Player turn · enemy legendary actions resolve end of this turn'],
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
        lines: ['Summoned ally · acts on this initiative'],
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
