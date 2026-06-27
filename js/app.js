/* The Pale Tide — UI (iPad Safari) */
(function () {
  const APP_OK = 'pale-tide-app-ok-v3';

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
    state = G.mergeStatePatch(state, patch);
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
        alertText.innerHTML = `<strong>${state.timerAlert.label}</strong><span class="timer-alert-hint">${state.timerAlert.hint}</span>`;
      } else {
        alertEl.classList.add('hidden');
        alertText.textContent = '';
      }
    }
  }

  function renderHeader() {
    setEl($('#header-round'), (el) => {
      el.textContent = `R${state.round}`;
    });
    setEl($('#header-phase'), (el) => {
      const ph = Math.min(3, Math.max(1, state.phase));
      el.textContent = `Ph ${ph}`;
      el.className = `header-phase phase-${ph}`;
    });
    setEl($('#header-live'), (el) => {
      el.hidden = document.documentElement.getAttribute('data-app') !== APP_OK;
    });
    renderTimer();
  }

  function renderClocks() {
    setEl($('#ritual-compact'), (n) => {
      n.textContent = state.ritual;
    });
    setEl($('#breach-compact'), (n) => {
      n.textContent = state.breach;
    });

    const pips = $('#breach-pips');
    pips.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      pips.appendChild(el('span', `breach-pip${i < state.breach ? ' filled' : ''}`));
    }

    setEl($('#header-clocks'), (bar) => {
      bar.classList.toggle('ritual-stopped', state.ritualStopped);
      bar.classList.toggle('ritual-high', state.ritual >= 10);
      bar.classList.toggle('breach-high', state.breach >= 4);
    });
  }

  function clearReminderPopupPosition(panel) {
    if (!panel) return;
    panel.classList.remove('anchored');
    panel.style.left = '';
    panel.style.top = '';
  }

  function scheduleReminderPopupPosition() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => positionReminderPopup());
    });
  }

  function positionReminderPopup() {
    const panel = $('#reminder-panel');
    const rail = $('#phase-rail');
    if (!panel || panel.classList.contains('hidden')) return;

    if (window.matchMedia('(max-width: 700px)').matches) {
      clearReminderPopupPosition(panel);
      return;
    }

    if (!rail) {
      clearReminderPopupPosition(panel);
      return;
    }

    const railRect = rail.getBoundingClientRect();
    const margin = 8;
    let left = railRect.left;
    let top = railRect.top;

    const banner = $('#gate-banner');
    const activePanel = document.querySelector('.tab-panel:not(.hidden)');

    if (state.activeTab === 'phase1' && banner && banner.offsetParent !== null) {
      const bannerRect = banner.getBoundingClientRect();
      left = bannerRect.left;
      top = bannerRect.top;
    } else if (activePanel) {
      const panelRect = activePanel.getBoundingClientRect();
      left = panelRect.left;
      top = panelRect.top;
    }

    panel.classList.add('anchored');
    const panelW = panel.offsetWidth;
    const panelH = panel.offsetHeight;
    const maxW = railRect.width - margin * 2;
    panel.style.maxWidth = `${Math.min(360, maxW)}px`;

    top = Math.max(railRect.top + margin, Math.min(top, railRect.bottom - panelH - margin));
    left = Math.max(railRect.left + margin, Math.min(left, railRect.right - panelW - margin));

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  function renderReminderPanel() {
    const panel = $('#reminder-panel');
    const slot = state.turnHighlight;

    if (!panel) return;

    if (!slot) {
      panel.className = 'reminder-popup hidden';
      panel.innerHTML = '';
      clearReminderPopupPosition(panel);
      return;
    }

    panel.className = 'reminder-popup';
    const info = R.reminderForSlot(state, slot);
    if (!info) {
      panel.className = 'reminder-popup hidden';
      panel.innerHTML = '';
      clearReminderPopupPosition(panel);
      return;
    }

    if (info.type === 'pc') {
      panel.innerHTML = `<h3>🎲 ${info.title} · init ${info.init}</h3><ul>${info.lines.map((line) => `<li>${line}</li>`).join('')}</ul>`;
      scheduleReminderPopupPosition();
      return;
    }

    if (info.type === 'summon') {
      panel.innerHTML = `<h3>✨ ${info.title} · init ${info.init}</h3><ul>${info.lines.map((line) => `<li>${line}</li>`).join('')}</ul>`;
      scheduleReminderPopupPosition();
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
      scheduleReminderPopupPosition();
      return;
    }

    let html = `<h3>${info.title} · init ${G.SLOT_INIT[slot]}</h3>`;
    if (info.batch != null) {
      html += M.formatBatchCombatHtml(info.batch, state.phase);
    }
    html += '<ul class="reminder-tactics">';
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
    scheduleReminderPopupPosition();
  }

  function renderInitRefStrip() {}

  function allActorsInTracker(actors) {
    return actors.length > 0 && actors.every((a) => a.inTracker && a.init != null);
  }

  function patchAllies(patch) {
    const pcs = patch.pcs ?? state.pcs;
    const summons = patch.summons ?? state.summons;
    const next = { ...patch, pcs, summons };
    if (allActorsInTracker(pcs) && allActorsInTracker(summons)) {
      next.alliesInitCollapsed = true;
    } else if (pcs.every((pc) => !pc.inTracker) && summons.every((s) => !s.inTracker)) {
      next.alliesInitCollapsed = false;
    }
    setState(next);
  }

  function patchPcs(pcs) {
    patchAllies({ pcs });
  }

  function patchSummons(summons) {
    patchAllies({ summons });
  }

  function alliesInitSummary() {
    const pcs = state.pcs || [];
    const summons = state.summons || [];
    const all = [...pcs, ...summons];
    const inTracker = all.filter((a) => a.inTracker).length;
    if (allActorsInTracker(pcs) && allActorsInTracker(summons)) {
      return `All ${all.length} in tracker`;
    }
    return `${inTracker}/${all.length} in tracker`;
  }

  function renderAlliesInit() {
    const pcs = state.pcs || [];
    const summons = state.summons || [];
    const panel = $('#allies-init-panel');
    const pcList = $('#pc-init-list');
    const summonList = $('#summon-init-list');
    if (!pcList || !summonList) return;

    setEl(panel, (container) => {
      container.classList.toggle('collapsed', !!state.alliesInitCollapsed);
    });
    setEl($('#allies-init-summary'), (container) => {
      container.textContent = alliesInitSummary();
    });
    setEl($('#btn-allies-init-toggle'), (container) => {
      container.setAttribute('aria-expanded', state.alliesInitCollapsed ? 'false' : 'true');
    });

    pcList.innerHTML = '';
    pcs.forEach((pc) => {
      const row = el('div', `pc-init-row${pc.inTracker ? ' in-tracker' : ''}`);
      const canTrack = pc.init != null;
      row.innerHTML = `
        <span class="pc-init-name">${pc.name}</span>
        <input type="text" class="pc-init-input" id="pc-init-${pc.id}" inputmode="numeric" pattern="[0-9]*" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="—" value="${pc.init != null ? pc.init : ''}" />
        <button type="button" class="ghost pc-init-toggle${pc.inTracker ? ' active' : ''}" data-pc-toggle="${pc.id}" onclick="PaleTideApp.tap(this,event)" ${canTrack ? '' : 'disabled'}>${pc.inTracker ? '✓ In' : '+ Tracker'}</button>
      `;
      pcList.appendChild(row);
    });
    summonList.innerHTML = '';
    summons.forEach((s) => {
      const row = el('div', `pc-init-row${s.inTracker ? ' in-tracker' : ''}`);
      const canTrack = s.init != null;
      row.innerHTML = `
        <span class="pc-init-name">${s.name}</span>
        <input type="text" class="pc-init-input" id="summon-init-${s.id}" inputmode="numeric" pattern="[0-9]*" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="—" value="${s.init != null ? s.init : ''}" />
        <button type="button" class="ghost pc-init-toggle${s.inTracker ? ' active' : ''}" data-summon-toggle="${s.id}" onclick="PaleTideApp.tap(this,event)" ${canTrack ? '' : 'disabled'}>${s.inTracker ? '✓ In' : '+ Tracker'}</button>
      `;
      summonList.appendChild(row);
    });
    setEl($('#btn-pc-add-all'), (el) => {
      el.disabled = !pcs.some((pc) => pc.init != null && !pc.inTracker);
    });
    setEl($('#btn-pc-clear-tracker'), (el) => {
      el.disabled = !pcs.some((pc) => pc.inTracker);
    });
    setEl($('#btn-summon-add-all'), (el) => {
      el.disabled = !summons.some((s) => s.init != null && !s.inTracker);
    });
    setEl($('#btn-summon-clear-tracker'), (el) => {
      el.disabled = !summons.some((s) => s.inTracker);
    });
  }

  function renderInitiative() {
    const order = G.resolveOrder(state);
    const list = $('#init-list');
    list.innerHTML = '';

    order.forEach((row) => {
      const isActive = state.turnHighlight === row.slot;
      const div = el(
        'div',
        `init-row${row.slot === 'lair' ? ' lair' : ''}${row.isPc ? ' pc' : ''}${row.isSummon ? ' summon' : ''}${isActive ? ' active' : ''}`,
        `
        <div class="init-count">${row.init}</div>
        <div class="init-info">
          <div class="name">${row.emoji} ${row.name}</div>
          <div class="units">${row.units}</div>
        </div>
        <button type="button" class="ghost mark-turn" data-slot="${row.slot}" style="min-height:40px;padding:0 12px;font-size:0.8rem" onclick="PaleTideApp.tap(this,event)">${isActive ? '✓' : 'Mark'}</button>
      `
      );
      list.appendChild(div);
    });

    renderAlliesInit();
  }

  function applyPhaseSectionCollapse(sectionAttr, collapsed, defaults) {
    const map = collapsed || defaults();
    $$(`.phase-section[data-${sectionAttr}]`).forEach((section) => {
      const key = section.getAttribute(`data-${sectionAttr}`);
      if (!key) return;
      section.classList.toggle('collapsed', !!map[key]);
      const toggle = section.querySelector('.phase-section-toggle');
      if (toggle) {
        toggle.setAttribute('aria-expanded', map[key] ? 'false' : 'true');
      }
    });
  }

  function renderPhaseSections() {
    applyPhaseSectionCollapse('phase1-section', state.phase1Collapsed, G.defaultPhase1Collapsed);
    applyPhaseSectionCollapse('phase2-section', state.phase2Collapsed, G.defaultPhase2Collapsed);
    applyPhaseSectionCollapse('phase3-section', state.phase3Collapsed, G.defaultPhase3Collapsed);
  }

  function applyInnerBustChoice(id) {
    const option = G.INNER_BUST_OPTIONS.find((o) => o.id === id);
    if (!option) return;

    const prev = state.innerBustChoice;
    let ritual = state.ritual;
    let breach = state.breach;
    let innerOpposedBonus = state.innerOpposedBonus || 0;

    if (prev && prev !== id) {
      if (prev === 'inventory') {
        breach = Math.max(0, breach - 1);
      } else if (!state.ritualStopped) {
        ritual = Math.max(0, ritual - 1);
      }
      if (prev === 'ledger') {
        innerOpposedBonus = Math.max(0, innerOpposedBonus - 2);
      }
    }

    if (!prev || prev !== id) {
      if (id === 'inventory') {
        breach = Math.min(6, breach + 1);
      } else if (!state.ritualStopped && ritual < 20) {
        ritual = Math.min(20, ritual + 1);
      }
      if (id === 'ledger') {
        innerOpposedBonus += 2;
      }
    }

    setState({
      innerBustPending: false,
      innerBustChoice: id,
      ritual,
      breach,
      innerOpposedBonus,
    });
  }

  function renderInnerBust() {
    const panel = $('#inner-bust-panel');
    const optionsEl = $('#inner-bust-options');
    const promptEl = $('#inner-bust-prompt');
    if (!panel || !optionsEl) return;

    const show = state.innerBustPending || state.innerBustChoice;
    panel.classList.toggle('hidden', !show);
    if (!show) {
      optionsEl.innerHTML = '';
      return;
    }

    if (promptEl) {
      promptEl.classList.toggle('hidden', !state.innerBustPending);
      promptEl.textContent = state.innerBustChoice
        ? "Ledger's price — tap to change:"
        : "Choose the ledger's price:";
    }

    optionsEl.innerHTML = G.INNER_BUST_OPTIONS.map(
      (opt) => `
        <button type="button" class="inner-bust-option${state.innerBustChoice === opt.id ? ' active' : ''}" data-inner-bust="${opt.id}" onclick="PaleTideApp.tap(this,event)">
          <span class="inner-bust-option-title">${opt.title}</span>
          <span class="inner-bust-option-effect">${opt.effect}</span>
        </button>
      `
    ).join('');
  }

  function applyGraveChurnAdd(add) {
    const amount = Math.max(0, Math.floor(Number(add) || 0));
    if (amount <= 0) return;
    const v = state.graveChurn + amount;
    const tiers = { ...state.graveTiers };
    if (v >= 50) tiers.t50 = true;
    if (v >= 75) tiers.t75 = true;
    if (v >= 100) tiers.t100 = true;
    setState({ graveChurn: v, graveTiers: tiers });
    const input = $('#grave-roll-input');
    if (input) input.value = '';
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
      setEl($(`#${low}-destroy`), (el) => {
        el.textContent = p.destroyed ? 'Restore' : 'Destroyed';
      });
    });
  }

  function renderSanctum() {
    const womanDisp = state.womanDisposition || 'neutral';
    ['friendly', 'neutral', 'hostile'].forEach((disp) => {
      setEl($(`#btn-woman-${disp}`), (el) => {
        el.classList.toggle('active', womanDisp === disp);
      });
    });
    setEl($('#woman-banshee-note'), (el) => {
      if (womanDisp === 'friendly') {
        el.innerHTML = 'Ph 3 banshee: <strong>friendly</strong> — will not attack unless provoked';
      } else if (womanDisp === 'neutral') {
        el.innerHTML = 'Ph 3 banshee: <strong>neutral</strong> — <strong>will attack</strong>';
      } else {
        el.innerHTML = 'Ph 3 banshee: <strong>hostile</strong> — <strong>will attack</strong>';
      }
    });
    setEl($('#children-removed'), (el) => {
      el.textContent = state.childrenRemoved;
    });
    setEl($('#btn-child-remove'), (el) => {
      el.disabled = state.childrenRemoved >= 10;
    });
    setEl($('#btn-norman-found'), (el) => {
      el.disabled = state.normanFound;
    });
    setEl($('#children-pass-note'), (el) => {
      el.classList.toggle('hidden', !state.normanFound);
    });
    setEl($('#rim-rite'), (el) => {
      el.checked = state.rimRiteKnown;
    });
    setEl($('#inner-buy'), (el) => {
      el.textContent = state.innerBuydowns;
    });
    renderInnerBust();

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

  function gateLocksClearedFrom(s) {
    return (s.gateLock1 && s.gateLock2) || s.gateSmashSuccesses >= 3;
  }

  function gateLocksCleared() {
    return gateLocksClearedFrom(state);
  }

  function applyAutoGateOpen(patch) {
    const next = { ...state, ...patch };
    if (gateLocksClearedFrom(next) && !state.gateOpen) {
      return {
        ...patch,
        gateOpen: true,
        gateRound: state.round,
        pulseOn: true,
        breach: Math.min(6, state.breach + 1),
        phase: Math.max(state.phase, 2),
        activeTab: 'phase2',
      };
    }
    return patch;
  }

  function nextPickTarget() {
    if (!state.gateLock1 && !state.gateLock1Unpickable) return 1;
    if (!state.gateLock2 && !state.gateLock2Unpickable) return 2;
    return null;
  }

  function clearNextGateLock() {
    if (gateLocksCleared() || state.gateToolsBroken) return false;
    const target = nextPickTarget();
    if (!target) return false;
    const patch = { gatePickStarted: true };
    if (target === 1) patch.gateLock1 = true;
    else patch.gateLock2 = true;
    setState(applyAutoGateOpen(patch));
    return true;
  }

  function pickFailBy5() {
    if (gateLocksCleared() || state.gateToolsBroken) return false;
    const target = nextPickTarget();
    if (!target) return false;
    const patch = { gatePickStarted: true, gateToolsBroken: true };
    if (target === 1) patch.gateLock1Unpickable = true;
    else patch.gateLock2Unpickable = true;
    setState(patch);
    return true;
  }

  function addSmashSuccess() {
    if (gateLocksCleared()) return false;
    const next = Math.min(3, state.gateSmashSuccesses + 1);
    const patch = { gateSmashSuccesses: next };
    if (next >= 3) {
      patch.gateLock1 = true;
      patch.gateLock2 = true;
      patch.gateSmashed = true;
    }
    setState(applyAutoGateOpen(patch));
    return true;
  }

  function renderGate() {
    const cleared = gateLocksCleared();
    const pickTarget = nextPickTarget();
    const picked = (state.gateLock1 ? 1 : 0) + (state.gateLock2 ? 1 : 0);
    setEl($('.gate-tracker'), (el) => {
      el.classList.toggle('gate-open', state.gateOpen);
    });
    setEl($('#gate-banner'), (el) => {
      el.className = `gate-banner ${state.gateOpen ? 'open' : 'locked'}`;
      if (state.gateOpen) {
        el.textContent = state.gateHeld
          ? 'GATE HELD · iron re-closed · hold the line'
          : 'GATE OPEN · pylons live · Inner accessible';
      } else if (state.gateSmashSuccesses > 0) {
        el.textContent = `SMASHING · ${state.gateSmashSuccesses}/3 successes`;
      } else if (state.gatePickStarted) {
        el.textContent = `PICKING · ${picked}/2 locks${state.gateToolsBroken ? ' · tools broken' : ''}`;
      } else {
        el.textContent = 'GATE LOCKED · pick or smash';
      }
    });
    setEl($('#gate-info'), (el) => {
      if (state.gateOpen) {
        el.textContent = state.gateHeld
          ? `Gate held R${state.gateRound} · iron re-closed · hold-gate buy-down available`
          : state.gateSmashed
            ? `Gate opened R${state.gateRound} · wrecked — cannot re-close in Ph 2`
            : `Gate opened R${state.gateRound} · picked — can re-close in Ph 2 to hold Breach`;
      } else if (state.gateToolsBroken) {
        el.textContent = 'Tools broken — jammed lock unpickable · finish via smash (3 successes · failures OK)';
      } else if (state.gatePickStarted && state.gateSmashSuccesses > 0) {
        el.textContent = 'Pick & smash in parallel — tap +1 only on smash success · failures don\'t reset progress';
      } else if (state.gateSmashSuccesses > 0) {
        el.textContent = 'Smashing — need 3 successes (Ath DC 22) · failures don\'t harm progress';
      } else if (state.gatePickStarted) {
        el.textContent = 'Picking — smash track also available (3 successes · gate can\'t re-close)';
      } else {
        el.textContent = 'Pick both locks OR smash 3× — separate tracks · smash failures OK';
      }
    });
    [1, 2].forEach((n) => {
      const clearedLock = n === 1 ? state.gateLock1 : state.gateLock2;
      const unpickable = n === 1 ? state.gateLock1Unpickable : state.gateLock2Unpickable;
      setEl($(`#gate-lock-${n}`), (el) => {
        el.classList.toggle('cleared', clearedLock);
        el.classList.toggle('unpickable', unpickable && !clearedLock);
        const icon = el.querySelector('.gate-lock-icon');
        if (icon) {
          icon.textContent = clearedLock ? '🔓' : unpickable ? '⛔' : '🔒';
        }
        const label = el.querySelector('.gate-lock-label');
        if (label) {
          label.textContent = clearedLock ? `Lock ${n} · open` : unpickable ? `Lock ${n} · jammed` : `Lock ${n}`;
        }
      });
    });
    setEl($('#gate-tools-broken'), (el) => {
      el.classList.toggle('hidden', !state.gateToolsBroken || state.gateOpen);
    });
    setEl($('#gate-smash-track'), (el) => {
      el.classList.toggle('hidden', state.gateOpen);
    });
    setEl($('#gate-smash-successes'), (container) => {
      container.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const filled = i < state.gateSmashSuccesses;
        const slot = el('div', `gate-smash-slot${filled ? ' filled' : ''}`);
        slot.innerHTML = `<span class="gate-smash-slot-icon" aria-hidden="true">${filled ? '✓' : '○'}</span><span class="gate-smash-slot-label">${filled ? 'Hit' : 'Need'} ${i + 1}</span>`;
        container.appendChild(slot);
      }
    });
    const canPick = !state.gateOpen && !cleared && !state.gateToolsBroken && pickTarget != null;
    setEl($('#btn-gate-pick'), (el) => {
      el.disabled = !canPick;
    });
    setEl($('#btn-gate-pick-fail'), (el) => {
      el.disabled = !canPick;
    });
    setEl($('#btn-gate-smash'), (el) => {
      el.disabled = state.gateOpen || cleared || state.gateSmashSuccesses >= 3;
    });
    const canHoldGate = state.gateOpen && state.phase >= 2 && !state.gateSmashed && !state.gateHeld;
    setEl($('#gate-hold-panel'), (el) => {
      el.classList.toggle('hidden', !canHoldGate);
    });
    setEl($('#gate-held-note'), (el) => {
      el.classList.toggle('hidden', !state.gateHeld);
    });
    setEl($('#gate-smashed-note'), (el) => {
      el.classList.toggle('hidden', !state.gateOpen || !state.gateSmashed);
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
      m.batch != null && G.BATCHES[m.batch]
        ? G.BATCHES[m.batch].name
        : m.id === 'pylon'
          ? 'Object'
          : 'NPC';
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
    if (state.turnHighlight) scheduleReminderPopupPosition();
  }

  function render() {
    safe('header', renderHeader);
    safe('clocks', renderClocks);
    safe('init-ref', renderInitRefStrip);
    safe('initiative', renderInitiative);
    safe('reminders', renderReminderPanel);
    safe('pylons', renderPylons);
    safe('phase-sections', renderPhaseSections);
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
      'button, .lair-card, .filter-chip, .monster-head, [data-phase], .mark-turn, .phase-section-toggle, .inner-bust-option'
    );
  }

  function handleTapOnNode(node) {
    if (!node) return;
    if (node.dataset.tab) {
      setState({ activeTab: node.dataset.tab });
      return;
    }

    if (node.dataset.innerBust) {
      applyInnerBustChoice(node.dataset.innerBust);
      return;
    }

    if (node.classList.contains('phase-section-toggle')) {
      if (node.dataset.phase1Section) {
        const key = node.dataset.phase1Section;
        const collapsed = { ...(state.phase1Collapsed || G.defaultPhase1Collapsed()) };
        collapsed[key] = !collapsed[key];
        setState({ phase1Collapsed: collapsed });
        return;
      }
      if (node.dataset.phase2Section) {
        const key = node.dataset.phase2Section;
        const collapsed = { ...(state.phase2Collapsed || G.defaultPhase2Collapsed()) };
        collapsed[key] = !collapsed[key];
        setState({ phase2Collapsed: collapsed });
        return;
      }
      if (node.dataset.phase3Section) {
        const key = node.dataset.phase3Section;
        const collapsed = { ...(state.phase3Collapsed || G.defaultPhase3Collapsed()) };
        collapsed[key] = !collapsed[key];
        setState({ phase3Collapsed: collapsed });
        return;
      }
    }

    if (node.dataset.phase) {
      const ph = parseInt(node.dataset.phase, 10);
      const tab = ph === 3 ? 'phase3' : ph === 2 ? 'phase2' : 'phase1';
      setState({ phase: ph, activeTab: tab });
      return;
    }

    if (node.dataset.pcToggle) {
      const id = node.dataset.pcToggle;
      const pcs = state.pcs.map((pc) => {
        if (pc.id !== id || pc.init == null) return pc;
        return { ...pc, inTracker: !pc.inTracker };
      });
      patchPcs(pcs);
      return;
    }

    if (node.dataset.summonToggle) {
      const id = node.dataset.summonToggle;
      const summons = state.summons.map((s) => {
        if (s.id !== id || s.init == null) return s;
        return { ...s, inTracker: !s.inTracker };
      });
      patchSummons(summons);
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
          setState({
            innerWins: 0,
            innerFails: 0,
            innerBustPending: true,
            innerBustChoice: null,
          });
        } else {
          setState({ innerFails: Math.min(2, f) });
        }
        return;
      }
      case 'btn-allies-init-toggle':
        setState({ alliesInitCollapsed: !state.alliesInitCollapsed });
        return;
      case 'btn-pc-add-all':
        patchPcs(
          state.pcs.map((pc) =>
            pc.init != null ? { ...pc, inTracker: true } : pc
          )
        );
        return;
      case 'btn-pc-clear-tracker':
        patchPcs(state.pcs.map((pc) => ({ ...pc, inTracker: false })));
        return;
      case 'btn-summon-add-all':
        patchSummons(
          state.summons.map((s) =>
            s.init != null ? { ...s, inTracker: true } : s
          )
        );
        return;
      case 'btn-summon-clear-tracker':
        patchSummons(state.summons.map((s) => ({ ...s, inTracker: false })));
        return;
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
      case 'btn-woman-friendly':
        setState({ womanDisposition: 'friendly' });
        return;
      case 'btn-woman-neutral':
        setState({ womanDisposition: 'neutral' });
        return;
      case 'btn-woman-hostile':
        setState({ womanDisposition: 'hostile' });
        return;
      case 'btn-child-remove':
        if (state.childrenRemoved >= 10) return;
        setState({ childrenRemoved: state.childrenRemoved + 1 });
        return;
      case 'btn-norman-found':
        if (state.normanFound) return;
        setState({ normanFound: true });
        return;
      case 'btn-gate-hold':
        if (!state.gateOpen || state.gateSmashed || state.gateHeld) return;
        setState({ gateHeld: true });
        return;
      case 'btn-gate-pick':
        if (gateLocksCleared() || state.gateToolsBroken) return;
        clearNextGateLock();
        return;
      case 'btn-gate-pick-fail':
        if (gateLocksCleared() || state.gateToolsBroken) return;
        pickFailBy5();
        return;
      case 'btn-gate-smash':
        if (gateLocksCleared()) return;
        addSmashSuccess();
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
        const cur = state[key];
        if (cur.destroyed) {
          setState({
            [key]: { shield: 100, stone: 90, destroyed: false },
          });
        } else {
          setState({
            [key]: { shield: 0, stone: 0, destroyed: true },
            ritual: Math.max(0, state.ritual - 2),
          });
        }
        return;
      }
      case 'grave-add-roll': {
        const input = $('#grave-roll-input');
        applyGraveChurnAdd(input?.value);
        return;
      }
      case 'grave-reset':
        setState({
          graveChurn: 25,
          graveTiers: { t25: true, t50: false, t75: false, t100: false },
        });
        if ($('#grave-roll-input')) $('#grave-roll-input').value = '';
        return;
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

    const pcInit = t.id.match(/^pc-init-(pc\d+)$/);
    if (pcInit) {
      if (e.type === 'input') return;
      const id = pcInit[1];
      const raw = String(t.value).trim();
      const parsed = raw === '' ? null : parseInt(raw, 10);
      const init = Number.isFinite(parsed) ? Math.max(0, Math.min(99, parsed)) : null;
      const pcs = state.pcs.map((pc) => {
        if (pc.id !== id) return pc;
        return { ...pc, init, inTracker: init == null ? false : pc.inTracker };
      });
      patchPcs(pcs);
      return;
    }

    const summonInit = t.id.match(/^summon-init-(summon\d+)$/);
    if (summonInit) {
      if (e.type === 'input') return;
      const id = summonInit[1];
      const raw = String(t.value).trim();
      const parsed = raw === '' ? null : parseInt(raw, 10);
      const init = Number.isFinite(parsed) ? Math.max(0, Math.min(99, parsed)) : null;
      const summons = state.summons.map((s) => {
        if (s.id !== id) return s;
        return { ...s, init, inTracker: init == null ? false : s.inTracker };
      });
      patchSummons(summons);
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
    const graveForm = $('#grave-churn-form');
    if (graveForm) {
      graveForm.addEventListener('submit', (e) => {
        e.preventDefault();
        applyGraveChurnAdd($('#grave-roll-input')?.value);
      });
    }
    const graveInput = $('#grave-roll-input');
    if (graveInput) {
      graveInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyGraveChurnAdd(graveInput.value);
        }
      });
    }
    window.addEventListener(
      'resize',
      () => {
        if (state.turnHighlight) positionReminderPopup();
      },
      { passive: true }
    );
    const phaseRail = $('#phase-rail');
    if (phaseRail) {
      phaseRail.addEventListener(
        'scroll',
        () => {
          if (state.turnHighlight) positionReminderPopup();
        },
        { passive: true }
      );
    }
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
