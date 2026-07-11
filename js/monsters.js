/* Monster stat blocks — from ENEMY_STAT_BLOCKS.md (L5 dial) */
(function (global) {
  const MONSTERS = [
    {
      id: 'horde',
      name: 'Horde body',
      sub: 'Zombie vanguard · minion',
      batch: 1,
      phases: [1, 2, 3],
      qty: '~18 × 5',
      cr: '—',
      stats: [
        ['AC', '12 (+2/+1 pylon ward)'],
        ['HP', '1 per body'],
        ['Speed', '20 ft (30 ft gate open)'],
        ['Attack', '+5 reach 5 ft · 1d4+2 blud/slash'],
        ['Marshal', '+7 if Marshal within 30 ft'],
      ],
      traits: [
        'Minion: damage kills; 0 damage unaffected',
        'Undead Fortitude (one horde only): Con 10 or drop to 1 HP once',
        'Mob turn: 5 attacks per horde on Horde turn',
        'AoE: 1 body dead per full die (min 1)',
      ],
      actions: [
        {
          name: 'Pinning Dead',
          text: 'Replace 2 attacks · Str DC 12 escape · Grappled/Restrained · no escape before turn end → no reactions until next turn',
        },
      ],
    },
    {
      id: 'hooded-horde',
      name: 'Hooded horde body',
      sub: 'Masked minion · Pale Ward crystal',
      batch: 1,
      phases: [1, 2, 3],
      qty: '~3–6',
      cr: '—',
      stats: [['Same as horde', '1 HP · +5 (+7 Marshal)']],
      traits: [
        'Reveal: horde ≤2 bodies · Perception DC 12 · Investigation DC 13',
        'Crystal: zombies within 30 ft ignore bearer unless Marshal commands',
      ],
      actions: [],
      special: [
        'Crystal: AC 12 · HP 8 · Dispel Magic DC 13 shatters',
      ],
    },
    {
      id: 'living-hood',
      name: 'Living hood',
      sub: 'Myrkul agent · living',
      batch: 4,
      phases: [1, 2, 3],
      qty: '~1–2',
      cr: '~3',
      stats: [
        ['AC', '14'],
        ['HP', '32'],
        ['Speed', '35 ft · Init +3'],
        ['Saves', 'Dex +5 · Con +4'],
      ],
      traits: ['Pale Ward crystal', 'Slip the Dead'],
      actions: [
        {
          name: 'Greenglass Dagger ×2',
          text: '+5 · 1d6+3 pierce + venom Con DC 13 or Poisoned',
        },
        { name: 'Fade into the Column (Bonus)', text: 'Dash or Disengage' },
      ],
      special: ['Targets Brussel if exposed · flees at half HP'],
    },
    {
      id: 'grave-hound',
      name: 'Grave hound',
      sub: 'Undead ghost dog',
      batch: 4,
      phases: [1, 2, 3],
      qty: '2',
      cr: '~4',
      stats: [
        ['AC', '14 (16/15 pylon)'],
        ['HP', '48'],
        ['Speed', '50 ft · Init +3'],
      ],
      traits: ['Incorporeal slip', 'Turn Resistance'],
      actions: [
        { name: 'Bite ×2', text: '+6 · 1d8+3 necrotic' },
        {
          name: 'Cold Howl (Bonus)',
          text: '30 ft · Wis DC 13 or Frightened until end of next turn',
        },
        { name: 'Pack Takedown', text: 'Both bites same target → Str DC 12 or Prone' },
      ],
      deploy: 'R2: 1 · R4+: 2 if Gate thin',
    },
    {
      id: 'ghost',
      name: 'Ghost',
      sub: 'Wraith dial',
      batch: 3,
      phases: [2, 3],
      qty: '5',
      cr: '~6',
      stats: [
        ['AC', '14 (16/15 pylon)'],
        ['HP', '52'],
        ['Speed', '5 ft · fly 60 hover · Init +4'],
      ],
      traits: ['Incorporeal Movement', 'Turn Resistance'],
      actions: [
        { name: 'Life Drain', text: '+6 · 3d8+3 necrotic · max HP − damage dealt' },
      ],
      deploy: 'R4: 2 peel · Ph3: +2–3 rim',
    },
    {
      id: 'death-knight',
      name: 'Death knight',
      sub: '2024 MM + L5 encounter',
      batch: 2,
      phases: [1, 2, 3],
      qty: '2',
      cr: '~5',
      stats: [
        ['AC', '17 (19/18 pylon)'],
        ['HP', '65'],
        ['Speed', '30 ft · Init +2'],
        ['Saves', 'Wis +5 · Cha +4'],
      ],
      traits: ['Legendary Resistance 1/day', 'Magic Resistance', 'Turn Resistance'],
      actions: [
        { name: 'Multiattack', text: '2× Dread Blade +6 · 1d8+3 slash + 2d6 nec' },
        {
          name: 'Hellfire Orb (Recharge 6)',
          text: 'Dex DC 13 · 20-ft radius · 4d6 fire + 4d6 nec half',
        },
        {
          name: 'Mortuary Stillness (Recharge 5–6)',
          text: '30-ft Con DC 15 · fail 3d6 nec + no healing until end of next turn',
        },
      ],
      legendary: [
        'Move · Strike · Command',
        'Chill Command · Wis DC 13 or Charmed',
        'Mute the Song · Wis DC 13 or disadv next spell attack/DC',
        'Ledger’s Pin · Str DC 13 or Restrained (escape 13)',
      ],
      variants: ['Marshal R2 · Heavy R6+'],
      special: ['Kill on Outer → Ritual −1 · one headline LA/round across both knights'],
    },
    {
      id: 'leader-lich',
      name: 'Leader lich',
      sub: 'Phase 3',
      batch: 5,
      phases: [3],
      qty: '1',
      cr: '~6',
      stats: [['AC', '15'], ['HP', '72']],
      actions: [
        { name: 'Paralyzing Touch', text: '+6 · 2d6 cold · Con DC 14 end of turn' },
        { name: 'Dread Blade', text: '+7 · 1d8+4 slash + 2d6 nec' },
        { name: 'Spellcasting DC 14', text: 'Ray of Frost · Blight · Counterspell · Cloudkill' },
      ],
      legendary: [
        'Cantrip · Frightening Gaze Wis DC 13 · Teleport 30 ft',
      ],
    },
    {
      id: 'keeper-lich',
      name: 'Ledger Keeper lich',
      sub: 'Phase 3',
      batch: 5,
      phases: [3],
      qty: '1',
      cr: '~5',
      stats: [['AC', '14'], ['HP', '65']],
      actions: [
        { name: 'Paralyzing Touch', text: '+5 · 2d6 cold · Con DC 14' },
        { name: 'Spellcasting DC 14', text: 'Chill Touch · Hold Person · Silence · Counterspell' },
      ],
      legendary: [
        'Frightening Gaze Wis DC 14 · Ledger’s Tally Con DC 14 or concentration at disadv',
      ],
    },
    {
      id: 'banshee',
      name: 'Weeping woman · banshee',
      sub: 'Phase 3 · Lower',
      batch: 3,
      phases: [3],
      qty: '1',
      cr: '~5',
      stats: [['AC', '12'], ['HP', '52'], ['Speed', 'fly 60 hover']],
      actions: [
        { name: 'Corrupting Touch', text: '+6 · 2d8+3 necrotic' },
        { name: 'Horrify', text: 'Wis DC 13 · Frightened' },
        {
          name: 'Deathly Wail (Recharge 5–6)',
          text: 'Con DC 14 · 4d8 psychic · ≤25 HP after dmg → 0 HP',
        },
      ],
      legendary: ['Drift · Touch · Keening Wis DC 13'],
      special: ['Friendly → neutral if Woman friendly on sanctum card'],
    },
    {
      id: 'apostle',
      name: 'Apostle of Myrkul',
      sub: 'Phase 3 boss',
      batch: 5,
      phases: [3],
      qty: '1',
      cr: '~7',
      stats: [
        ['AC', '16'],
        ['HP', '110 premature · 140 if Ritual 20'],
        ['Traits', 'LR 2/day · Grave Lord Presence · Magical Plate −2 · wheel'],
      ],
      actions: [
        { name: 'Scythe of Reaping', text: '+7 reach 10 ft · 2d6+4 slash + 2d6 nec · Con DC 13 max HP − nec' },
        { name: 'Call of the Damned', text: 'Str DC 13 · 4d8 nec + pulled 15 ft' },
        { name: 'Gaze of the Dead (Bonus)', text: 'Wis DC 13 or Frightened' },
      ],
      reactions: [
        'Consume: minion dies 60 ft → heal 2d8+4',
        'Dead Thoughts: Wis DC 14 or no psychic next turn',
      ],
      legendary: [
        '1 · Swipe · 2 · Finger of Death Con DC 14 · 4d8+10 nec',
        '3 · Stare of Mortality Con DC 13 or disadv next save',
        'Budget · 2/round · 3 when bloodied',
      ],
    },
    {
      id: 'leader-npc',
      name: 'The Leader',
      sub: 'Phases 1–2 · Time Armour',
      batch: null,
      phases: [1, 2],
      qty: '1',
      cr: '—',
      stats: [['Time Armour', 'Cannot be damaged until Time Collapse']],
      traits: [
        'Disrupt counting: Insight DC 18 → Ritual −1 (Chung-Hin / Andrew / Wizard Arcana)',
        'Track bust: CON 17 or 4d10 banish 2nd offender',
      ],
      actions: [],
    },
    {
      id: 'keeper-npc',
      name: 'Ledger Keeper',
      sub: 'Phases 1–2 · Ritual +1/round',
      batch: null,
      phases: [1, 2],
      qty: '1',
      cr: '—',
      stats: [['Time Armour', 'Ritual +1/round while counting']],
      traits: [],
      actions: [],
    },
    {
      id: 'pylon',
      name: 'Rim pylon',
      sub: 'Object · 2 when gate opens',
      batch: null,
      phases: [2, 3],
      qty: '2',
      cr: '—',
      stats: [
        ['Stone', 'AC 17 · HP 35 · destroyed Ritual −2'],
        ['Hardening', 'Both +2 AC Outer undead · one +1'],
      ],
      traits: [
        'R+2 Wail Wis DC 13 · Breach +1 on fail',
        'R+4 & R+7 cone 4d6 + Stillness Con DC 15',
      ],
      actions: [],
      special: ['Stone only — no shield layer at this table'],
    },
  ];

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: '1', label: 'Horde' },
    { id: '2', label: 'Knights' },
    { id: '3', label: 'Wraiths' },
    { id: '4', label: 'Hunters' },
    { id: '5', label: 'Apex' },
    { id: 'npc', label: 'NPC' },
    { id: 'object', label: 'Objects' },
  ];

  function filterMonsters(filterId, phase) {
    return MONSTERS.filter((m) => {
      if (phase && !m.phases.includes(phase)) return false;
      if (filterId === 'all') return true;
      if (filterId === 'npc') return m.id.endsWith('-npc');
      if (filterId === 'object') return m.id === 'pylon';
      return String(m.batch) === filterId;
    });
  }

  function monsterVitals(m) {
    const parts = [];
    m.stats.forEach(([k, v]) => {
      if (k === 'AC' || k === 'HP') parts.push(`${k} ${v}`);
    });
    const speed = m.stats.find(([k]) => k === 'Speed');
    if (speed && /init/i.test(speed[1])) parts.push(speed[1]);
    return parts.join(' · ');
  }

  function monsterAttacks(m) {
    const out = [];
    m.stats.forEach(([k, v]) => {
      if (k === 'Attack' || k === 'Marshal') out.push({ name: k, text: v });
    });
    (m.actions || []).forEach((a) => {
      if (typeof a === 'string') out.push({ name: 'Action', text: a });
      else out.push({ name: a.name, text: a.text });
    });
    (m.reactions || []).forEach((r) => {
      const text = typeof r === 'string' ? r : r.text || String(r);
      out.push({ name: 'Reaction', text });
    });
    (m.legendary || []).forEach((l) => {
      const text = typeof l === 'string' ? l : l.text || String(l);
      if (/^Budget ·/i.test(text)) return;
      out.push({ name: 'Legendary', text });
    });
    return out;
  }

  function batchCombatUnits(batch, phase) {
    return MONSTERS.filter((m) => {
      if (m.batch !== batch) return false;
      if (phase && !m.phases.includes(phase)) return false;
      if (m.id.endsWith('-npc') || m.id === 'pylon') return false;
      return monsterAttacks(m).length > 0 || m.stats.some(([k]) => k === 'AC');
    });
  }

  function formatBatchCombatHtml(batch, phase) {
    const units = batchCombatUnits(batch, phase);
    if (!units.length) return '';
    let html = '<div class="reminder-combat">';
    units.forEach((m) => {
      const vitals = monsterVitals(m);
      const attacks = monsterAttacks(m);
      html += `<div class="reminder-unit"><div class="reminder-unit-name">${m.name}</div>`;
      if (vitals) html += `<div class="reminder-vitals">${vitals}</div>`;
      if (attacks.length) {
        html += '<ul class="reminder-attacks">';
        attacks.forEach((a) => {
          html += `<li><strong>${a.name}</strong> · ${a.text}</li>`;
        });
        html += '</ul>';
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  global.PaleTideMonsters = {
    MONSTERS,
    FILTERS,
    filterMonsters,
    batchCombatUnits,
    formatBatchCombatHtml,
  };
})(window);
