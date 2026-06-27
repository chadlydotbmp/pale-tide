/* Monster stat blocks — from ENEMY_STAT_BLOCKS.md */
(function (global) {
  const MONSTERS = [
    {
      id: 'horde',
      name: 'Horde body',
      sub: 'Zombie vanguard · minion',
      batch: 1,
      phases: [1, 2, 3],
      qty: '~20 × 5',
      cr: '—',
      stats: [
        ['AC', '14 (+5/+3 pylon ward)'],
        ['HP', '1 per body'],
        ['Speed', '20 ft (30 ft gate open)'],
        ['Attack', '+8 reach 5 ft · 1d6+4 blud/slash'],
        ['Marshal', '+10 if Marshal within 30 ft'],
      ],
      traits: [
        'Minion: damage kills; 0 damage unaffected',
        'Undead Fortitude (one horde only): Con 15 or drop to 1 HP once',
        'Mob turn: 5 attacks per horde on Horde turn',
        'AoE: 1 body dead per full die (min 1)',
      ],
      actions: [
        {
          name: 'Pinning Dead',
          text: 'Replace 2 attacks in one horde · Str DC 16 escape · Grappled/Restrained · no escape/dmg/attack before turn end → can’t extend Rage',
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
      stats: [['Same as horde', '1 HP · +8 (+10 Marshal)']],
      traits: [
        'Reveal: horde ≤2 bodies · Perception DC 17 · Investigation DC 18 on corpse',
        'Crystal: zombies within 30 ft ignore bearer unless Marshal commands',
      ],
      actions: [],
      special: [
        'Crystal object: AC 12 · HP 10 · immune nec/pois/psych · Dispel Magic DC 18 shatters',
        'Taken/destroyed: undead within 30 ft no longer ignore figure',
      ],
    },
    {
      id: 'living-hood',
      name: 'Living hood',
      sub: 'Myrkul agent · living',
      batch: 1,
      phases: [1, 2, 3],
      qty: '~1–3',
      cr: '~8',
      stats: [
        ['AC', '16'],
        ['HP', '98'],
        ['Speed', '40 ft · Init +6'],
        ['Saves', 'Dex +9 · Con +8'],
        ['Skills', 'Stealth +9 · Perception +7'],
      ],
      traits: ['Pale Ward crystal', 'Slip the Dead: move through zombie spaces'],
      actions: [
        {
          name: 'Greenglass Dagger ×2',
          text: '+10 · 1d6+5 pierce + venom Con DC 19 or Poisoned until hood’s next turn',
        },
        {
          name: 'Fade into the Column (Bonus)',
          text: 'Dash or Disengage',
        },
      ],
      special: [
        'Targets Brussel if exposed (adv if no PC within 15 ft)',
        'Flees at half HP · grave spawns may hide/run without engaging',
      ],
    },
    {
      id: 'grave-hound',
      name: 'Grave hound',
      sub: 'Undead ghost dog',
      batch: 2,
      phases: [1, 2, 3],
      qty: '2',
      cr: '~10',
      stats: [
        ['AC', '19 (24/22 pylon)'],
        ['HP', '148'],
        ['Speed', '60 ft · Init +5'],
        ['Immune', 'Blinded, Charmed, Deafened, Frightened, Stunned, Unconscious'],
      ],
      traits: ['Incorporeal slip', 'Turn Resistance'],
      actions: [
        { name: 'Bite ×2', text: '+11 · 2d8+6 necrotic' },
        {
          name: 'Cold Howl (Bonus)',
          text: '30 ft · Wis DC 19 or Frightened until end of next turn · pierces Rage · disadv if saw PC drop to 0 HP',
        },
        {
          name: 'Pack Takedown',
          text: 'Both bites hit same target → Str DC 20 or Prone',
        },
      ],
      deploy: 'R2: 1 · R4+: 2 if Gate thin · Brussel → casters → flank',
    },
    {
      id: 'ghost',
      name: 'Ghost',
      sub: 'Wraith dial',
      batch: 3,
      phases: [1, 2, 3],
      qty: '7',
      cr: '~10',
      stats: [
        ['AC', '15 (20/18 pylon)'],
        ['HP', '142'],
        ['Speed', '5 ft · fly 60 hover · Init +5'],
        ['Resist', 'Acid, B/P/S, Cold, Fire'],
        ['Immune', 'Necrotic, Poison + conditions'],
      ],
      traits: ['Incorporeal Movement', 'Sunlight Sensitivity', 'Turn Resistance'],
      actions: [
        {
          name: 'Life Drain',
          text: '+10 · 5d8+6 necrotic · max HP − damage dealt',
        },
        {
          name: 'Soul Grit',
          text: 'Crit or 4 wraiths on one target in a round · Raging: Con DC 23 or Rage ends + expend 1 use',
        },
      ],
      deploy: 'R4: 2 skull pits · Ph3: +3–5 rim · peel Theokoles or Acerian on Tile G',
    },
    {
      id: 'death-knight',
      name: 'Death knight',
      sub: '2024 MM + encounter',
      batch: 2,
      phases: [1, 2, 3],
      qty: '3',
      cr: '17',
      stats: [
        ['AC', '20 (25/23 pylon) · Blade Singer 21'],
        ['HP', '199'],
        ['Speed', '30 ft · Init +12'],
        ['Saves', 'Wis +9 · Dex +6 · Con +5'],
        ['Immune', 'Necrotic, Poison · Exhaustion, Frightened, Poisoned'],
      ],
      traits: [
        'Legendary Resistance 3/day',
        'Magic Resistance',
        'Marshal Undead: undead 60 ft adv attacks/saves',
        'Turn Resistance',
        'Parry reaction: +6 AC vs one melee hit',
      ],
      actions: [
        { name: 'Multiattack', text: '3× Dread Blade +11 · 2d6+5 slash + 3d8 nec' },
        {
          name: 'Hellfire Orb (Recharge 5–6)',
          text: 'Dex DC 18 · 20-ft radius 120 ft · 10d6 fire + 10d6 nec half',
        },
        {
          name: 'Spellcasting DC 18',
          text: 'At will: Command, Phantom Steed · 2/day: Destructive Wave (nec), Dispel Magic',
        },
        {
          name: 'Mortuary Stillness (Recharge 5–6)',
          text: '30-ft radius Con DC 23 · fail 6d6 nec + no healing until Greater Restoration · Rage ends',
        },
      ],
      legendary: [
        'Move · half speed, no OA',
        'Strike · +12 longsword · 2d8+6 slash + 2d6 nec',
        'Command · one cluster half speed',
        'Chill Command · Wis DC 21 or Charmed until end of next turn (non-Raging)',
        'Bone Litany · Wis DC 21 or can’t extend Rage next turn (Raging)',
        'Crown’s Weight · Wis DC 21 or auras off until end of next turn (Anax)',
        'Skull Weight · Wis DC 21 or no psychic until end of next turn (Theokoles)',
        'Blade Burst (Blade Singer LA) · 30-ft line · 8d8 force · Dex DC 18 half',
      ],
      variants: [
        'Marshal R2 gate · Marshal of the Dead · hordes +10 · 2 LA/round',
        'Heavy R6+ · Still Crown Standard · auras suppressed 30 ft · Thunderous Rebuke 60-ft line Dex 21 or 8d6 thunder + Stunned',
        'Blade Singer rim R4+ · AC+1 · +1 blade · Misty Step 1/day · 3 LA/round',
      ],
      special: ['Kill on Outer mat → Ritual −1 (max 3) · one headline LA/round'],
    },
    {
      id: 'leader-lich',
      name: 'Leader lich',
      sub: 'Phase 3 · Counting House',
      batch: 5,
      phases: [3],
      qty: '1',
      cr: '21→enc',
      stats: [
        ['AC', '18'],
        ['HP', '240'],
        ['Saves', 'Dex +6 · Con +10 · Int +8 · Wis +9'],
        ['Immune', 'Necrotic, Poison'],
        ['Traits', 'LR 2/day · Magic Resistance · Turn Resistance'],
      ],
      actions: [
        {
          name: 'Multiattack',
          text: 'Paralyzing Touch + Dread Blade',
        },
        {
          name: 'Paralyzing Touch',
          text: '+10 · 3d6 cold · Paralyzed Con DC 20 end of turn',
        },
        { name: 'Dread Blade', text: '+12 · 2d8+6 slash + 3d8 nec' },
        {
          name: 'Spellcasting DC 20',
          text: 'At will: Mage Hand, Ray of Frost · 3/day: Blight, Counterspell, Dimension Door · 1/day: Cloudkill',
        },
      ],
      legendary: [
        'Cantrip · Ray of Frost +12 · 2d8 cold',
        'Frightening Gaze · Wis DC 20 or Frightened until end of next turn · pierces Rage',
        'Teleport · 60 ft to seen space',
        'Bone Litany · Wis DC 21 or can’t extend Rage next turn (Raging)',
      ],
    },
    {
      id: 'keeper-lich',
      name: 'Ledger Keeper lich',
      sub: 'Phase 3',
      batch: 5,
      phases: [3],
      qty: '1',
      cr: '21→enc',
      stats: [
        ['AC', '17'],
        ['HP', '200'],
        ['Saves', 'Dex +5 · Con +9 · Int +9 · Wis +10'],
        ['Immune', 'Necrotic, Poison'],
        ['Traits', 'LR 2/day · Magic Resistance · Turn Resistance'],
      ],
      actions: [
        {
          name: 'Multiattack',
          text: '2× Paralyzing Touch +9 · 3d6 cold · Paralyzed Con DC 21',
        },
        {
          name: 'Spellcasting DC 21',
          text: 'At will: Mage Hand, Chill Touch · 3/day: Counterspell, Dispel Magic, Hold Monster, Silence · 1/day: Finger of Death',
        },
      ],
      legendary: [
        'Cantrip · Chill Touch +13 · 2d8 necrotic',
        'Frightening Gaze · Wis DC 21 or Frightened until end of next turn · pierces Rage',
        'Teleport · 60 ft to seen space',
        'Ledger’s Tally · Con DC 21 or concentration save at disadv',
      ],
    },
    {
      id: 'banshee',
      name: 'Weeping woman · banshee',
      sub: 'Phase 3 · Lower',
      batch: 3,
      phases: [3],
      qty: '1',
      cr: '13',
      stats: [
        ['AC', '16'],
        ['HP', '178'],
        ['Speed', '5 ft · fly 60 hover · Init +4'],
        ['Saves', 'Wis +9 · Cha +11'],
        ['Resist', 'Acid, B/P/S, Fire, Lightning, Thunder'],
        ['Immune', 'Cold, Necrotic, Poison + many conditions'],
      ],
      traits: [
        'Detect Life 1 mile',
        'Incorporeal Movement',
        'LR 1/day · Turn Resistance',
        'Counted in the Ledger: first dmg/round Con DC 21 or disadv vs Wail/Horrify',
      ],
      actions: [
        { name: 'Multiattack', text: '2× Corrupting Touch + Horrify' },
        { name: 'Corrupting Touch', text: '+10 · 3d8+6 necrotic' },
        {
          name: 'Horrify',
          text: 'Wis DC 20 · 60 ft · Frightened until her next turn · pierces Rage · success immune 24 hr',
        },
        {
          name: 'Deathly Wail (Recharge 5–6)',
          text: 'Con DC 21 · 30 ft · 8d8 psychic · ≤100 HP after dmg → 0 HP · Norm’s Echo: adv if friendly',
        },
      ],
      legendary: [
        'Drift · fly half speed, no OA',
        'Touch · Corrupting Touch +10 · 3d8+6 necrotic',
        'Keening · Wis DC 20 or Frightened until end of her next turn · pierces Rage',
        'Still Counting · Wis DC 21 or no healing until end of her next turn',
      ],
      special: [
        'Friendly → neutral · no LA unless provoked',
        'Hostile → Deathly Wail opener · peel casters / ignored her',
      ],
    },
    {
      id: 'apostle',
      name: 'Apostle of Myrkul',
      sub: 'Phase 3 boss · last',
      batch: 5,
      phases: [3],
      qty: '1',
      cr: 'apex',
      stats: [
        ['AC', '19'],
        ['HP', '580 premature · 725 if Ritual 20 (bloodied ≤ half max)'],
        ['Speed', 'fly 30 hover · Init +8'],
        ['Saves', 'Str +10 · Con +10 · Wis +9 · Cha +11'],
        ['Immune', 'Cold, Necrotic, Poison + 3 rotating wheel'],
        ['Traits', 'LR 3/day · Grave Lord Presence 30 ft · Magical Plate −5 dmg · Turn Resistance'],
      ],
      actions: [
        {
          name: 'Multiattack',
          text: '2× Scythe or Scythe + Call of the Damned',
        },
        {
          name: 'Scythe of Reaping',
          text: '+12 reach 15 ft · 2d8+6 slash + 3d8 nec · Con DC 21 or max HP − nec until long rest',
        },
        {
          name: 'Call of the Damned (Recharge 5–6)',
          text: '60 ft · Str DC 21 · fail 8d8 nec + pulled 30 ft',
        },
        {
          name: 'Gaze of the Dead (Bonus)',
          text: '60 ft below max HP · Wis DC 20 or Frightened · pierces Rage',
        },
      ],
      reactions: [
        'Consume the Faithful: minion dies 60 ft → heal 6d8+6 · next Scythe +3d8 nec · Empowered',
        'Dead Thoughts: on psychic damage · attacker Wis DC 23 or no psychic next turn',
      ],
      legendary: [
        '1 · Swipe · Scythe +12 · 2d8+6 slash + 3d8 nec · Con DC 21 or max HP − nec',
        '2 · Finger of Death (Empowered only) · Con DC 21 · 7d8+30 nec (half on success)',
        '3 · Stare of Mortality · Con DC 20 or +1 Exhaustion',
        'Budget · 3/round · 4 when bloodied',
      ],
      special: [
        'Wheel: acid, fire, force, lightning, physical, psychic, radiant, thunder — FIFO on 4th type',
        'Arrives: Ritual 20 (725 HP) · Breach 6 · all 3 rim sites consecrated (580 HP) · both pylons down · clock ≥ 2:15',
      ],
    },
    {
      id: 'leader-npc',
      name: 'The Leader',
      sub: 'Phases 1–2 · Time Armour · no stat block',
      batch: null,
      phases: [1, 2],
      qty: '1',
      cr: '—',
      stats: [['Time Armour', 'Cannot be damaged until Time Collapse']],
      traits: [
        'Counting House parley · opposed liturgy · Inner track win',
        'Track bust: banish 2nd offender · pick ledger price (5 options)',
        'Caught inside = inner failure · d20 at disadvantage to slip notice',
        'Attack consequences: backlash · +1 inner fail · Ritual +1 · Marshal next Horde turn',
      ],
      actions: [],
    },
    {
      id: 'keeper-npc',
      name: 'Ledger Keeper',
      sub: 'Phases 1–2 · Time Armour · Ritual +1/round',
      batch: null,
      phases: [1, 2],
      qty: '1',
      cr: '—',
      stats: [
        ['Time Armour', 'Cannot be damaged until Time Collapse'],
        ['Bubble', 'Half cover + adv saves for reader · Ritual +1/round'],
      ],
      traits: [
        'Counting House reader · opposed liturgy · lattice knowledge beats',
        'Disrupt counting: Insight DC 26 → Ritual −1 (Kilgore)',
        'Caught inside = inner failure · d20 at disadvantage · same attack consequences as Leader',
      ],
      actions: [],
    },
    {
      id: 'pylon',
      name: 'Rim pylon',
      sub: 'Object · 2 on mat when gate opens',
      batch: null,
      phases: [2, 3],
      qty: '2',
      cr: '—',
      stats: [
        ['Shield', 'AC 25 · HP 100 · immune nec/pois/psych · regen +d100 init 20'],
        ['Stone', 'AC 25 · HP 90 · destroyed Ritual −2'],
        ['Hardening', 'Both stones +5 AC Outer undead · one +3'],
      ],
      traits: [
        'Ward: no teleport/flight · Misty Step/Dimension Door blocked',
        'G+0 Wail Wis DC 21 (disadv if Raging) · Frightened pierces Rage · can’t extend Rage · no psychic until next turn',
        'G+4+ cone 12d6 necrotic + Stillness Con DC 23',
        'Null Pulse: no auras · no psychic · radiant healing halved 60 ft',
      ],
      actions: [],
      special: ['Stagger ≥25 dmg since pulse → no cone · stone ≤44 → Null 30 ft only'],
    },
  ];

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: '1', label: 'Horde' },
    { id: '2', label: 'Knights' },
    { id: '3', label: 'Wraiths' },
    { id: '4', label: 'Reserves' },
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
