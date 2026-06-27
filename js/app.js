/* The Pale Tide — UI (iPad Safari) */
(function () {
  const APP_OK = 'pale-tide-app-ok-v3';
  const BUILD = '__BUILD__';

  function bootError(msg) {
    let bar = document.getElementById('boot-error');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'boot-error';
      bar.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:9999;background:#c45c5c;color:#fff;padding:12px 16px;font-size:14px;line-height:1.4';
      document.body.appendChild(bar);
    }
    bar.textContent = msg;
  }

  if (!window.PaleTide || !window.PaleTideReminders || !window.PaleTideMonsters) {
    bootError('App failed to load — re-copy index.html or use serve.sh on your Mac.');
    return;
  }

  const G = window.PaleTide;
  const R = window.PaleTideReminders;
  const M = window.PaleTideMonsters;
  let state = G.load();

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function setEl(el, fn) {
    if (el) fn(el);
  }

  function commit() {
    G.save(state);
    render();
  }

  function safe(name, fn) {
    try {
      fn();
    } catch (err) {
      bootError(name + ': ' + (err && err.message ? err.message : String(err)));
    }
  }

  function setState(patch) {
    state = { ...state, ...patch };
    commit();
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function formatSessionClock(ms) {
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const mm = totalMin % 60;
    return `${h}:${String(mm).padStart(2, '0')}`;
  }

  function checkTimerMarkers() {
    const elapsed = G.timerElapsedMs(state);
    const elapsedMin = elapsed / 60000;
    const fired = state.timerFired.slice();
    let alert = state.timerAlert;
    let changed = false;

    for (let i = 0; i < G.TIME_MARKERS.length; i++) {
      const mk = G.TIME_MARKERS[i];
      if (mk.min === 0 || fired.indexOf(mk.min) >= 0) continue;
      if (elapsedMin >= mk.min) {
        fired.push(mk.min);
        alert = { label: mk.label, hint: mk.hint };
        changed = true;
        try {
          if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
        } catch (_) {}
      }
    }

    if (changed) {
      state = { ...state, timerFired: fired, timerAlert: alert };
      G.save(state);
    }
  }

  function renderTimer() {
    checkTimerMarkers();
    const elapsed = G.timerElapsedMs(state);
    const elapsedMin = elapsed / 60000;
    const seg = G.timerSegment(elapsedMin);
    const next = G.timerNextMarker(elapsedMin);
    const hardStop = G.TIME_MARKERS[G.TIME_MARKERS.length - 1].min;

    const clockEl = $('#timer-clock');
    const segEl = $('#timer-segment');
    const toggleEl = $('#btn-timer-toggle');
    const wrapEl = $('#session-timer');
    const alertEl = $('#timer-alert');
    const alertText = $('#timer-alert-text');

    if (clockEl) clockEl.textContent = formatSessionClock(elapsed);
    if (segEl) {
      segEl.textContent = next
        ? `Next ${next.label} · ${next.hint}`
        : seg.hint;
    }
    if (toggleEl) {
      toggleEl.textContent = state.timerPaused ? '▶' : '⏸';
      toggleEl.classList.toggle('paused', state.timerPaused);
      toggleEl.title = state.timerPaused ? 'Resume timer' : 'Pause timer';
    }
    if (wrapEl) {
      wrapEl.classList.toggle('paused', state.timerPaused);
      wrapEl.classList.toggle('overtime', elapsedMin >= hardStop);
      const near =
        next && next.min - elapsedMin <= 2 && next.min - elapsedMin > 0;
      wrapEl.classList.toggle('at-marker', !!near);
    }
    if (alertEl && alertText) {
      if (state.timerAlert) {
        alertEl.classList.remove('hidden');
        alertText.innerHTML = `<strong>${state.timerAlert.label}</strong> — ${state.timerAlert.hint}`;
      } else {
        alertEl.classList.add('hidden');
        alertText.textContent = '';
      }
    }
  }

  function renderHeader() {
    const g = G.gTrack(state);
    $('#header-title').textContent = 'The Pale Tide';
    $('#meta-chips').innerHTML = [
      `<span class="chip">${BUILD}</span>`,
      `<span class="chip">R${state.round}</span>`,
      g != null ? `<span class="chip">G+${g - 1}${g === 1 ? ' (open)' : ''}</span>` : '',
      state.gateOpen ? '<span class="chip">Gate OPEN</span>' : '<span class="chip">Gate LOCKED</span>',
      state.phase >= 3 ? '<span class="chip phase-3">Phase 3</span>' : `<span class="chip">Phase ${state.phase}</span>`,
      state.pulseOn ? '<span class="chip pulse-on">PULSE</span>' : '',
      state.timerPaused ? '<span class="chip">Timer paused</span>' : '',
    ]
      .filter(Boolean)
      .join('');
    renderTimer();
  }

  function renderClocks() {
    setEl($('#ritual-compact'), (n) => {
      n.textContent = state.ritual;
    });
    setEl($('#breach-compact'), (n) => {
      n.textContent = state.breach;
    });
    $('#ritual-stop').classList.toggle('hidden', !state.ritualStopped);

    const pips = $('#breach-pips');
    pips.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      pips.appendChild(el('span', `breach-pip${i < state.breach ? ' filled' : ''}`));
    }

    setEl($('.clocks-bar'), (bar) => {
      bar.classList.toggle('ritual-stopped', state.ritualStopped);
      bar.classList.toggle('ritual-high', state.ritual >= 10);
      bar.classList.toggle('breach-high', state.breach >= 4);
    });

    const g = G.gTrack(state);
    const cone = G.nextConeG(state);
    const gEl = $('#g-info');
    const pylonEl = $('#pylon-ac');
    if (gEl) {
      if (g == null) {
        gEl.classList.add('hidden');
      } else {
        gEl.classList.remove('hidden');
        gEl.textContent = `G = R${state.gateRound} · next cone G+${cone}${G.isConeRound(state) ? ' ← THIS ROUND' : ''}`;
      }
    }
    if (pylonEl) {
      if (!state.gateOpen) {
        pylonEl.classList.add('hidden');
      } else {
        pylonEl.classList.remove('hidden');
        pylonEl.textContent = `Pale Ward +${G.pylonAcBonus(state)} AC on Outer undead`;
      }
    }
  }

  function shortHint(row) {
    if (row.slot === 'lair') {
      return 'Pick ONE lair · +d100/pylon · Apostle +30 if Ph3';
    }
    const t = R.reminderForBatch(row.batch);
    if (!t) return '';
    if (t.la && t.la.budget) return t.lines[0] + ' · LA: ' + t.la.budget;
    return t.lines[0];
  }

  function renderInitRefStrip() {
    const strip = $('#init-ref-strip');
    strip.innerHTML = R.INIT_COUNTS.map(
      (c) =>
        `<span class="init-ref-chip"><strong>${c.init}</strong> ${c.home}</span>`
    ).join('');
  }

  function renderReminderPanel() {
    const panel = $('#reminder-panel');
    const slot = state.turnHighlight;

    if (!slot) {
      panel.className = 'reminder-panel empty';
      panel.innerHTML =
        'Tap <strong>Mark</strong> on an initiative row · reminders for that batch, legendary actions, or lair (20)';
      return;
    }

    panel.className = 'reminder-panel';
    const info = R.reminderForSlot(state, slot);
    if (!info) {
      panel.className = 'reminder-panel empty';
      panel.innerHTML = 'Unknown batch — tap <strong>Mark</strong> again or tap <strong>New Round</strong>';
      return;
    }

    if (info.type === 'lair') {
      const cards = info.actions
        .map(
          (a) => `
        <button type="button" class="lair-card${state.lairPick === a.name ? ' selected' : ''}" data-lair="${a.name}" onclick="PaleTideApp.tap(this,event)">
          <div class="lair-name">${a.name}</div>
          <div class="lair-detail">${a.effect}<br><strong>Save:</strong> ${a.save}</div>
        </button>`
        )
        .join('');
      panel.innerHTML = `
        <h3>🌑 Init 20 · Lair (one per round)</h3>
        <ul>${info.extras.map((e) => `<li>${e}</li>`).join('')}</ul>
        <div class="lair-grid">${cards}</div>
        <p class="la-note" style="margin-top:10px">${info.pickOne}</p>
      `;
      return;
    }

    let html = `<h3>${info.title} · init ${G.SLOT_INIT[slot]}</h3><ul>`;
    info.lines.forEach((line) => {
      html += `<li>${line}</li>`;
    });
    html += '</ul>';

    if (info.la) {
      html += '<div class="la-block"><h4>Legendary actions</h4>';
      html += `<p class="la-note">${info.la.note || ''} · <strong>${info.la.budget}</strong></p>`;
      if (info.batch === 2) {
        html += `<div class="la-counter">
          <span>Knights LA this round:</span>
          <button type="button" id="la-knights-minus" onclick="PaleTideApp.tap(this,event)">−</button>
          <strong id="la-knights-val">${state.laKnightsUsed}</strong>/2
          <button type="button" id="la-knights-plus" onclick="PaleTideApp.tap(this,event)">+</button>
        </div>`;
      }
      if (info.batch === 5 && state.apostleOnMat) {
        const max = state.apostleBloodied ? 4 : 3;
        html += `<div class="la-counter">
          <span>Apostle LA this round:</span>
          <button type="button" id="la-apostle-minus" onclick="PaleTideApp.tap(this,event)">−</button>
          <strong id="la-apostle-val">${state.laApostleUsed}</strong>/${max}
          <button type="button" id="la-apostle-plus" onclick="PaleTideApp.tap(this,event)">+</button>
        </div>`;
      }
      if (info.la.sections) {
        info.la.sections.forEach((sec) => {
          html += `<p class="la-note" style="margin-top:8px"><strong>${sec.name}</strong></p><ul>`;
          sec.options.forEach((o) => {
            html += `<li>${o}</li>`;
          });
          html += '</ul>';
        });
      } else if (info.la.options) {
        html += '<ul>';
        info.la.options.forEach((o) => {
          html += `<li>${o}</li>`;
        });
        html += '</ul>';
      }
      html += '</div>';
    }

    panel.innerHTML = html;
  }

  function renderLairQuickRef() {
    const box = $('#lair-quick-ref');
    if (!box) return;
    box.innerHTML = R.LAIR.actions
      .map(
        (a) => `
      <button type="button" class="lair-card${state.lairPick === a.name ? ' selected' : ''}" data-lair-ref="${a.name}" onclick="PaleTideApp.tap(this,event)">
        <div class="lair-name">${a.name}</div>
        <div class="lair-detail">${a.effect} · ${a.save}</div>
      </button>`
      )
      .join('');
  }

  function renderInitiative() {
    const order = G.resolveOrder(state);
    const list = $('#init-list');
    list.innerHTML = '';

    if (state.round === 1) {
      $('#shuffle-info').textContent = 'Round 1 — default order (shuffle from R2)';
    } else if (state.shuffleRoll != null) {
      $('#shuffle-info').textContent = `Shuffle d5 = ${state.shuffleRoll} · rotated ${state.shuffleRoll === 1 ? 0 : state.shuffleRoll - 1} steps`;
    } else {
      $('#shuffle-info').textContent = 'Tap “New Round” to shuffle';
    }

    order.forEach((row) => {
      const isActive = state.turnHighlight === row.slot;
      const hint = isActive ? shortHint(row) : '';
      const div = el(
        'div',
        `init-row${row.slot === 'lair' ? ' lair' : ''}${isActive ? ' active' : ''}`,
        `
        <div class="init-count">${row.init}</div>
        <div class="init-info">
          <div class="name">${row.emoji} ${row.name}${row.batch ? ` <span style="color:var(--muted);font-weight:400">· Batch ${row.batch}</span>` : ''}</div>
          <div class="units">${row.units}</div>
        </div>
        <button type="button" class="ghost mark-turn" data-slot="${row.slot}" style="min-height:40px;padding:0 12px;font-size:0.8rem" onclick="PaleTideApp.tap(this,event)">${isActive ? '✓' : 'Mark'}</button>
        ${hint ? `<div class="reminder-hint">${hint}</div>` : ''}
      `
      );
      list.appendChild(div);
    });

  }

  function renderPylons() {
    ['A', 'B'].forEach((id) => {
      const key = `pylon${id}`;
      const p = state[key];
      const low = id.toLowerCase();
      const card = $(`#pylon-${low}`);
      if (!card) return;
      card.classList.toggle('destroyed', p.destroyed);
      setEl($(`#pylon-${low}-shield`), (el) => {
        el.style.width = `${Math.max(0, (p.shield / 100) * 100)}%`;
      });
      setEl($(`#pylon-${low}-stone`), (el) => {
        el.style.width = `${Math.max(0, (p.stone / 90) * 100)}%`;
      });
      setEl($(`#pylon-${low}-shield-val`), (el) => {
        el.textContent = p.shield;
      });
      setEl($(`#pylon-${low}-stone-val`), (el) => {
        el.textContent = p.stone;
      });
    });
  }

  function renderSanctum() {
    setEl($('#woman-friendly'), (el) => {
      el.checked = state.womanFriendly;
    });
    setEl($('#rim-rite'), (el) => {
      el.checked = state.rimRiteKnown;
    });
    setEl($('#inner-buy'), (el) => {
      el.textContent = state.innerBuydowns;
    });

    const wins = $('#win-dots');
    if (wins) {
      wins.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        wins.appendChild(el('span', `dot${i < state.innerWins ? ' win' : ''}`, i + 1));
      }
    }
    const fails = $('#fail-dots');
    if (fails) {
      fails.innerHTML = '';
      for (let i = 0; i < 2; i++) {
        fails.appendChild(el('span', `dot${i < state.innerFails ? ' fail' : ''}`, i + 1));
      }
    }

    setEl($('#grave-val'), (el) => {
      el.textContent = state.graveChurn;
    });
    ['t25', 't50', 't75', 't100'].forEach((t) => {
      setEl($(`#tier-${t}`), (el) => {
        el.checked = state.graveTiers[t];
      });
    });

    ['north', 'east', 'skull'].forEach((a) => {
      setEl($(`#anchor-${a}-loc`), (el) => {
        el.checked = state.anchors[a].located;
      });
      setEl($(`#anchor-${a}-bind`), (el) => {
        el.checked = state.anchors[a].bound;
      });
    });
  }

  function renderApostle() {
    setEl($('#apostle-hp'), (el) => {
      el.value = state.apostleHp;
    });
    setEl($('#apostle-lr'), (el) => {
      el.textContent = state.apostleLr;
    });
    setEl($('#apostle-bloodied'), (el) => {
      el.checked = state.apostleBloodied;
    });
    setEl($('#apostle-on'), (el) => {
      el.checked = state.apostleOnMat;
    });
    const wheel = G.normalizeApostleWheel(state.apostleWheel);
    G.WHEEL_TYPES.forEach(({ id }) => {
      setEl($(`#wheel-${id}`), (el) => {
        el.checked = wheel.includes(id);
      });
    });
    setEl($('#wheel-order'), (el) => {
      if (!wheel.length) {
        el.textContent = 'None filed yet';
        return;
      }
      el.innerHTML = wheel
        .map(
          (id, i) =>
            `<span class="wheel-slot"><strong>Rot ${i + 1}</strong> ${G.wheelLabel(id)}</span>`
        )
        .join('');
    });
  }

  function renderGate() {
    setEl($('#gate-banner'), (el) => {
      el.className = `gate-banner ${state.gateOpen ? 'open' : 'locked'}`;
      el.textContent = state.gateOpen
        ? 'GATE OPEN · pylons live · Inner accessible'
        : 'GATE LOCKED · road spawns only';
    });
    setEl($('#gate-info'), (el) => {
      if (state.gateOpen) {
        el.textContent = `Gate opened R${state.gateRound} · switch to Phase 2 for G-track & pylons`;
      } else {
        el.textContent = 'Road spawns only · Gate + Lane fronts · Breach 6 = road lost';
      }
    });
  }

  function monsterSection(title, items, asActions) {
    if (!items || !items.length) return '';
    let html = `<div class="monster-section"><h4>${title}</h4>`;
    if (asActions) {
      html += items
        .map(
          (a) =>
            `<div class="action-item"><strong>${a.name}</strong>${typeof a === 'string' ? a : a.text}</div>`
        )
        .join('');
    } else {
      html += `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
    }
    html += '</div>';
    return html;
  }

  function renderMonsterCard(m) {
    const open = state.monsterOpen === m.id;
    const batchLabel =
      m.batch != null ? `Batch ${m.batch}` : m.id === 'pylon' ? 'Object' : 'NPC';
    const statsHtml = m.stats
      .map(([k, v]) => `<div class="stat-row"><dt>${k}</dt><dd>${v}</dd></div>`)
      .join('');

    let body = `<div class="stat-grid">${statsHtml}</div>`;
    body += monsterSection('Traits', m.traits, false);
    body += monsterSection('Actions & abilities', m.actions, true);
    body += monsterSection('Reactions', m.reactions, false);
    body += monsterSection('Legendary actions', m.legendary, false);
    body += monsterSection('Variants', m.variants, false);
    body += monsterSection('Special / encounter', m.special, false);
    if (m.deploy) {
      body += `<div class="monster-section"><h4>Deploy</h4><p style="margin:0;font-size:0.85rem">${m.deploy}</p></div>`;
    }

    const card = el('div', `monster-card${open ? ' open' : ''}`);
    card.innerHTML = `
      <button type="button" class="monster-head" data-monster-id="${m.id}" onclick="PaleTideApp.tap(this,event)">
        <div>
          <div class="title">${m.name}</div>
          <div class="sub">${m.sub}</div>
          <div class="meta-row">${batchLabel} · CR ${m.cr} · Qty ${m.qty}</div>
        </div>
        <span class="chevron">${open ? '▼' : '▶'}</span>
      </button>
      <div class="monster-body">${body}</div>
    `;
    return card;
  }

  function renderMonsters() {
    const filters = $('#monster-filters');
    const list = $('#monster-list');
    if (!filters || !list) return;

    filters.innerHTML = M.FILTERS.map(
      (f) =>
        `<button type="button" class="filter-chip${state.monsterFilter === f.id ? ' active' : ''}" data-filter="${f.id}" onclick="PaleTideApp.tap(this,event)">${f.label}</button>`
    ).join('');

    const monsters = M.filterMonsters(state.monsterFilter, null);

    list.innerHTML = '';
    if (!monsters.length) {
      list.innerHTML = '<p style="color:var(--muted);text-align:center;padding:24px">No creatures in this filter</p>';
      return;
    }
    monsters.forEach((m) => list.appendChild(renderMonsterCard(m)));
  }

  function renderTabs() {
    const isCombat = state.activeTab === 'phase1' || state.activeTab === 'phase2' || state.activeTab === 'phase3';
    setEl($('#combat-layout'), (el) => {
      el.classList.toggle('hidden', !isCombat);
    });
    $$('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
    });
    $$('.tab-panel').forEach((panel) => {
      panel.classList.toggle('hidden', panel.dataset.tab !== state.activeTab);
    });
  }

  function render() {
    safe('header', renderHeader);
    safe('clocks', renderClocks);
    safe('init-ref', renderInitRefStrip);
    safe('reminders', renderReminderPanel);
    safe('initiative', renderInitiative);
    safe('lair', renderLairQuickRef);
    safe('pylons', renderPylons);
    safe('sanctum', renderSanctum);
    safe('apostle', renderApostle);
    safe('gate', renderGate);
    safe('monsters', renderMonsters);
    safe('tabs', renderTabs);
  }

  function tapTarget(e) {
    var t = e.target;
    if (t && t.nodeType === 3) t = t.parentElement;
    if (!t || !t.closest) return null;
    return t.closest(
      'button, .lair-card, .filter-chip, .monster-head, [data-phase], .mark-turn'
    );
  }

  function handleTapOnNode(node) {
    if (!node) return;
    if (node.dataset.tab) {
      setState({ activeTab: node.dataset.tab });
      return;
    }

    if (node.dataset.phase) {
      const ph = parseInt(node.dataset.phase, 10);
      const tab = ph === 3 ? 'phase3' : ph === 2 ? 'phase2' : 'phase1';
      setState({ phase: ph, activeTab: tab });
      return;
    }

    if (node.classList.contains('mark-turn')) {
      const slot = node.dataset.slot;
      setState({ turnHighlight: state.turnHighlight === slot ? null : slot });
      return;
    }

    if (node.classList.contains('filter-chip')) {
      setState({ monsterFilter: node.dataset.filter, monsterOpen: null });
      return;
    }

    if (node.dataset.lairRef) {
      const name = node.dataset.lairRef;
      setState({
        turnHighlight: 'lair',
        lairPick: state.lairPick === name ? null : name,
      });
      return;
    }

    if (node.dataset.lair) {
      setState({ lairPick: state.lairPick === node.dataset.lair ? null : node.dataset.lair });
      return;
    }

    if (node.classList.contains('monster-head')) {
      const id = node.dataset.monsterId;
      setState({ monsterOpen: state.monsterOpen === id ? null : id });
      return;
    }

    switch (node.id) {
      case 'btn-ritual-plus':
        if (state.ritualStopped || state.ritual >= 20) return;
        setState({ ritual: Math.min(20, state.ritual + 1) });
        return;
      case 'btn-ritual-minus':
        setState({ ritual: Math.max(0, state.ritual - 1) });
        return;
      case 'btn-ritual-fed': {
        if (state.ritualStopped || state.ritual >= 20) return;
        const add = Math.min(2 - state.fedHordesThisRound, 1);
        if (add <= 0) return;
        setState({
          ritual: Math.min(20, state.ritual + add),
          fedHordesThisRound: state.fedHordesThisRound + add,
        });
        return;
      }
      case 'btn-breach-plus':
        setState({ breach: Math.min(6, state.breach + 1) });
        return;
      case 'btn-breach-minus':
        setState({ breach: Math.max(0, state.breach - 1) });
        return;
      case 'btn-buy-pylon':
        setState({ ritual: Math.max(0, state.ritual - 2) });
        return;
      case 'btn-buy-anchor':
        if (state.innerBuydowns >= 3) return;
        setState({ ritual: Math.max(0, state.ritual - 1), innerBuydowns: state.innerBuydowns + 1 });
        return;
      case 'btn-buy-inner':
        if (state.innerBuydowns >= 3) return;
        setState({ ritual: Math.max(0, state.ritual - 1), innerBuydowns: state.innerBuydowns + 1 });
        return;
      case 'btn-buy-knight':
        setState({ ritual: Math.max(0, state.ritual - 1) });
        return;
      case 'btn-inner-win': {
        const w = state.innerWins + 1;
        if (w >= 3 && state.innerFails < 2) {
          setState({
            innerWins: 0,
            innerFails: 0,
            innerBuydowns: Math.min(3, state.innerBuydowns + 1),
            ritual: Math.max(0, state.ritual - 1),
          });
        } else {
          setState({ innerWins: Math.min(3, w) });
        }
        return;
      }
      case 'btn-inner-fail': {
        const f = state.innerFails + 1;
        if (f >= 2 && state.innerWins < 3) {
          setState({ innerWins: 0, innerFails: 0, ritual: Math.min(20, state.ritual + 1) });
        } else {
          setState({ innerFails: Math.min(2, f) });
        }
        return;
      }
      case 'btn-new-round': {
        const d5 = Math.floor(Math.random() * 5) + 1;
        const steps = d5 === 1 ? 0 : d5 - 1;
        setState({
          round: state.round + 1,
          fedHordesThisRound: 0,
          assignment: G.rotateAssignment(state.assignment, steps),
          shuffleRoll: d5,
          pulseOn: false,
          turnHighlight: null,
          lairPick: null,
          laKnightsUsed: 0,
          laApostleUsed: 0,
        });
        return;
      }
      case 'btn-shuffle-preview': {
        const d5 = Math.floor(Math.random() * 5) + 1;
        const steps = d5 === 1 ? 0 : d5 - 1;
        setState({
          assignment: G.rotateAssignment(
            state.round === 1 ? { ...G.DEFAULT_ASSIGNMENT } : state.assignment,
            steps
          ),
          shuffleRoll: d5,
        });
        return;
      }
      case 'btn-pulse-on':
        setState({ pulseOn: true });
        return;
      case 'btn-pulse-off':
        setState({ pulseOn: false });
        return;
      case 'btn-open-gate':
        setState({
          gateOpen: true,
          gateRound: state.round,
          pulseOn: true,
          breach: Math.min(6, state.breach + 1),
          phase: Math.max(state.phase, 2),
          activeTab: 'phase2',
        });
        return;
      case 'btn-phase-3':
        setState({
          phase: 3,
          apostleOnMat: true,
          ritualStopped: true,
          ritual: Math.min(state.ritual, 20),
          activeTab: 'phase3',
        });
        return;
      case 'btn-apostle-arrives':
        setState({
          apostleOnMat: true,
          ritualStopped: true,
          phase: 3,
          ritual: 20,
          activeTab: 'phase3',
        });
        return;
      case 'a-shield-minus':
      case 'b-shield-minus': {
        const key = node.id.charAt(0) === 'a' ? 'pylonA' : 'pylonB';
        const p = { ...state[key], shield: Math.max(0, state[key].shield - 10) };
        setState({ [key]: p });
        return;
      }
      case 'a-shield-plus':
      case 'b-shield-plus': {
        const key = node.id.charAt(0) === 'a' ? 'pylonA' : 'pylonB';
        const p = { ...state[key], shield: Math.min(100, state[key].shield + 10) };
        setState({ [key]: p });
        return;
      }
      case 'a-stone-minus':
      case 'b-stone-minus': {
        const key = node.id.charAt(0) === 'a' ? 'pylonA' : 'pylonB';
        const p = { ...state[key], stone: Math.max(0, state[key].stone - 10) };
        if (p.stone === 0) p.destroyed = true;
        setState({ [key]: p });
        return;
      }
      case 'a-regen':
      case 'b-regen': {
        const key = node.id.charAt(0) === 'a' ? 'pylonA' : 'pylonB';
        const roll = Math.floor(Math.random() * 100) + 1;
        const p = { ...state[key], shield: Math.min(100, state[key].shield + roll) };
        setState({ [key]: p });
        return;
      }
      case 'a-destroy':
      case 'b-destroy': {
        const key = node.id.charAt(0) === 'a' ? 'pylonA' : 'pylonB';
        setState({
          [key]: { shield: 0, stone: 0, destroyed: true },
          ritual: Math.max(0, state.ritual - 2),
        });
        return;
      }
      case 'grave-plus': {
        const v = state.graveChurn + 10;
        const tiers = { ...state.graveTiers };
        if (v >= 50) tiers.t50 = true;
        if (v >= 75) tiers.t75 = true;
        if (v >= 100) tiers.t100 = true;
        setState({ graveChurn: v, graveTiers: tiers });
        return;
      }
      case 'apostle-lr-use':
        setState({ apostleLr: Math.max(0, state.apostleLr - 1) });
        return;
      case 'la-knights-minus':
        setState({ laKnightsUsed: Math.max(0, state.laKnightsUsed - 1) });
        return;
      case 'la-knights-plus':
        setState({ laKnightsUsed: Math.min(3, state.laKnightsUsed + 1) });
        return;
      case 'la-apostle-minus':
        setState({ laApostleUsed: Math.max(0, state.laApostleUsed - 1) });
        return;
      case 'la-apostle-plus':
        setState({
          laApostleUsed: Math.min(state.apostleBloodied ? 4 : 3, state.laApostleUsed + 1),
        });
        return;
      case 'btn-reset':
        if (confirm('Reset all encounter state? This cannot be undone.')) {
          state = G.reset();
          commit();
        }
        return;
      case 'btn-break':
        setState({
          breakTaken: true,
          timerPaused: true,
          timerPauseStart: Date.now(),
        });
        return;
      case 'btn-timer-toggle': {
        if (state.timerPaused) {
          const pauseDur = Date.now() - (state.timerPauseStart || Date.now());
          setState({
            timerPaused: false,
            timerPauseStart: null,
            timerPauseTotal: state.timerPauseTotal + pauseDur,
          });
        } else {
          setState({
            timerPaused: true,
            timerPauseStart: Date.now(),
          });
        }
        return;
      }
      case 'btn-timer-dismiss':
        setState({ timerAlert: null });
        return;
      default:
        break;
    }
  }

  function handleTap(e) {
    var node = tapTarget(e);
    if (!node) return;
    handleTapOnNode(node);
  }

  function publicTap(el, e) {
    e = e || window.event;
    if (e && e.preventDefault) e.preventDefault();
    var node = el;
    if (typeof el === 'string') node = document.getElementById(el);
    if (node && node.nodeType === 3) node = node.parentElement;
    handleTapOnNode(node);
  }

  function handleChange(e) {
    const t = e.target;
    if (!t || !t.id) return;

    if (t.id === 'woman-friendly') {
      setState({ womanFriendly: t.checked });
      return;
    }
    if (t.id === 'rim-rite') {
      setState({ rimRiteKnown: t.checked });
      return;
    }
    if (t.id === 'apostle-on') {
      setState({ apostleOnMat: t.checked, ritualStopped: t.checked });
      return;
    }
    if (t.id === 'apostle-bloodied') {
      setState({ apostleBloodied: t.checked });
      return;
    }
    if (t.id === 'apostle-hp') {
      const hp = parseInt(t.value, 10) || 0;
      setState({ apostleHp: hp, apostleBloodied: hp <= 290 });
      return;
    }

    const anchorLoc = t.id.match(/^anchor-(north|east|skull)-loc$/);
    if (anchorLoc) {
      const a = anchorLoc[1];
      const anchors = { ...state.anchors, [a]: { ...state.anchors[a], located: t.checked } };
      setState({ anchors });
      return;
    }

    const anchorBind = t.id.match(/^anchor-(north|east|skull)-bind$/);
    if (anchorBind) {
      const a = anchorBind[1];
      const anchors = { ...state.anchors, [a]: { ...state.anchors[a], bound: t.checked } };
      const bound = t.checked;
      setState({
        anchors,
        ritual: bound ? Math.max(0, state.ritual - 1) : state.ritual,
        innerBuydowns: bound ? Math.min(3, state.innerBuydowns + 1) : state.innerBuydowns,
      });
      return;
    }

    const wheelPick = t.id.match(/^wheel-(acid|fire|force|lightning|physical|psychic|radiant|thunder)$/);
    if (wheelPick) {
      const type = wheelPick[1];
      let next = G.normalizeApostleWheel(state.apostleWheel);
      const idx = next.indexOf(type);
      if (t.checked) {
        if (idx === -1) {
          if (next.length >= 3) next.shift();
          next.push(type);
        }
      } else if (idx !== -1) {
        next.splice(idx, 1);
      }
      setState({ apostleWheel: next });
      return;
    }
  }

  function bindActions() {
    window.PaleTideApp._go = publicTap;
    window.PaleTideApp.tap = publicTap;
    var q = window.PaleTideApp._q || [];
    window.PaleTideApp._q = [];
    for (var i = 0; i < q.length; i++) {
      publicTap(q[i][0], q[i][1]);
    }
    document.addEventListener('change', handleChange, false);
    document.addEventListener('input', handleChange, false);
  }

  function boot() {
    try {
      bindActions();
      render();
      document.documentElement.setAttribute('data-app', APP_OK);
      var warn = document.getElementById('boot-warn');
      if (warn) warn.style.display = 'none';
      setInterval(function () {
        safe('timer', renderTimer);
      }, 1000);
    } catch (err) {
      var msg = 'Startup failed: ' + (err && err.message ? err.message : String(err));
      bootError(msg);
      try {
        alert('Pale Tide: ' + msg);
      } catch (_) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
