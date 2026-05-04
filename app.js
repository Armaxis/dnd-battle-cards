// localStorage key for persisting characters and battle name
const STORAGE_KEY = 'dnd-battle-cards-v1';
let CLASSES = null;

// Application state
let state = {
  characters: [],       // Array of character objects
  selectedId: null,     // Currently selected/edited character ID
  battleName: '',       // Title shown on printed cards
  picked: new Set(),    // IDs of characters EXCLUDED from print
  layout: '6',          // '6' | '4' | '2' (cards per page)
  settings: {},         // Global settings
};

// ---------- boot ----------
// Initialize app: load data, build UI, wire events, render
(function init() {
  CLASSES = CLASSES_DATA;
  load();
  buildClassOptions();
  bindForm();
  bindBattle();
  bindIO();
  bindSettings();
  render();
  renderBattle();
  if (state.characters.length > 0 && !state.selectedId) {
    state.selectedId = state.characters[0].id;
    render();
  }
})();

// ---------- persistence ----------
// Load characters and battle name from localStorage
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      state.characters = (d.characters || []).map(migrateChar);
      state.battleName = d.battleName || '';
      state.settings = d.settings || {};
    }
  } catch {}
}

// Migrate legacy character objects to current schema.
// Converts old single-resource fields to resources array,
// infers isSpellcaster for old data, removes deprecated keys.
function migrateChar(c) {
  if (c.isSpellcaster === undefined) {
    c.isSpellcaster = isSpellcaster(c.class);
  }
  if (Array.isArray(c.resources)) return c;
  if (c.resourceName && c.resourceName.trim()) {
    c.resources = [{ name: c.resourceName, count: c.resourceCount || 0 }];
  } else {
    c.resources = [];
  }
  delete c.resourceName;
  delete c.resourceCount;
  delete c.autoResource;
  return c;
}

// Persist characters and battle name to localStorage
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    characters: state.characters,
    battleName: state.battleName,
    settings: state.settings,
  }));
}

// ---------- class presets ----------
// Populate the class <select> dropdown from CLASSES_DATA
function buildClassOptions() {
  const sel = document.getElementById('class-select');
  sel.innerHTML = Object.keys(CLASSES.classes)
    .map(c => `<option value="${c}">${c}</option>`).join('');
}

// Look up spell slot array for a given class and level.
// Returns a 9-element array (one per spell level) for full/half casters,
// or maps warlock pact slot count to the correct spell level index.
function slotsForLevel(className, level) {
  const cls = CLASSES.classes[className];
  if (!cls) return null;
  if (cls.caster === 'full')  return CLASSES.casterTypes.full[level - 1];
  if (cls.caster === 'half')  return CLASSES.casterTypes.half[level - 1];
  if (cls.caster === 'warlock') {
    const w = CLASSES.casterTypes.warlock[level - 1];
    const arr = [0,0,0,0,0,0,0,0,0];
    arr[w.level - 1] = w.slots;
    return arr;
  }
  return [0,0,0,0,0,0,0,0,0];
}

// Check if a class has spellcasting (caster type is not 'none')
function isSpellcaster(className) {
  const cls = CLASSES.classes[className];
  return cls && cls.caster !== 'none';
}

// ---------- library ----------
// Render the character list and populate the editor form for the selected character
function render() {
  const list = document.getElementById('char-list');
  list.innerHTML = state.characters.map(c => `
    <li data-id="${c.id}" class="${c.id === state.selectedId ? 'selected' : ''}">
      <span>${escapeHtml(c.name || '(unnamed)')}</span>
      <span class="meta">${escapeHtml(c.class || '')} ${c.level || ''}</span>
    </li>
  `).join('');
  list.querySelectorAll('li').forEach(li => {
    li.onclick = () => selectChar(li.dataset.id);
  });
  if (state.selectedId) fillForm(state.characters.find(c => c.id === state.selectedId));
  else document.getElementById('char-form').hidden = true;
}

// Select a character for editing
function selectChar(id) {
  state.selectedId = id;
  render();
}

// Create a new blank character and select it for editing
document.getElementById('new-char').onclick = () => {
  const c = {
    id: crypto.randomUUID(),
    name: '', class: 'Wizard', level: 1,
    ac: 10, hp: 8, speed: 30,
    resist: '',
    spellSaveDC: '', spellAttack: '', spellMod: '',
    isSpellcaster: false, autoSlots: true, slots: null,
    resources: [],
  };
  state.characters.push(c);
  state.selectedId = c.id;
  state.picked.add(c.id);
  save(); render(); renderBattle();
};

// Wire up form events: auto-refresh, add resource, submit, cancel, delete
function bindForm() {
  const form = document.getElementById('char-form');
  const autoSlots = form.autoSlots;
  const classSel = form.class;
  const levelInput = form.level;

  // Refresh spell slot inputs when class, level, or autoSlots changes
  const refreshAuto = () => {
    if (autoSlots.checked) renderManualSlots(true);
    else renderManualSlots(false);
  };

  classSel.onchange = () => { refreshAuto(); updateSpellFields(); };
  levelInput.oninput = () => { refreshAuto(); updateSpellFields(); };
  autoSlots.onchange = refreshAuto;
  form.isSpellcaster.onchange = () => { updateSpellFields(); };

  // Add an empty resource row to the current character
  document.getElementById('add-resource').onclick = () => {
    const c = state.characters.find(x => x.id === state.selectedId);
    if (!c) return;
    c.resources.push({ name: '', count: 0 });
    renderResourceList();
  };

  // Save character from form values
  form.onsubmit = (e) => {
    e.preventDefault();
    const c = state.characters.find(x => x.id === state.selectedId);
    if (!c) return;
    c.resources = collectResources();
    Object.assign(c, {
      name: form.name.value,
      class: form.class.value,
      level: +form.level.value,
      ac: +form.ac.value,
      hp: +form.hp.value,
      speed: +form.speed.value,
      resist: form.resist.value,
      spellSaveDC: form.spellSaveDC.value,
      spellAttack: form.spellAttack.value,
      spellMod: form.spellMod.value,
      isSpellcaster: form.isSpellcaster.checked,
      autoSlots: form.autoSlots.checked,
    });
    if (!c.autoSlots) {
      c.slots = [];
      for (let i = 1; i <= 9; i++) c.slots.push(+form[`slot${i}`].value || 0);
    } else {
      c.slots = null;
    }
    save(); render(); renderBattle();
  };

  // Deselect character without saving
  document.getElementById('cancel-edit').onclick = () => {
    state.selectedId = null; render();
  };

  // Delete character after confirmation
  document.getElementById('delete-char').onclick = () => {
    if (!confirm('Delete this character?')) return;
    state.characters = state.characters.filter(c => c.id !== state.selectedId);
    state.selectedId = null;
    save(); render(); renderBattle();
  };
}

// Read all resource rows from the DOM and return a clean array
function collectResources() {
  const list = document.getElementById('resources-list');
  const rows = list.querySelectorAll('.resource-row');
  const res = [];
  rows.forEach(row => {
    const name = row.querySelector('.res-name-input').value.trim();
    const count = +row.querySelector('.res-count-input').value || 0;
    if (name) res.push({ name, count });
  });
  return res;
}

// Render the list of resource rows with name/count inputs and reorder/remove buttons
function renderResourceList() {
  const host = document.getElementById('resources-list');
  const c = state.characters.find(x => x.id === state.selectedId);
  if (!c) return;
  host.innerHTML = c.resources.map((r, i) => `
    <div class="resource-row" data-idx="${i}">
      <input class="res-name-input" placeholder="Resource name" value="${escapeHtml(r.name)}">
      <input class="res-count-input" type="number" min="0" value="${r.count}" style="width:55px">
      <button class="btn-sm" type="button" data-action="up" ${i === 0 ? 'disabled' : ''}>▲</button>
      <button class="btn-sm" type="button" data-action="down" ${i === c.resources.length - 1 ? 'disabled' : ''}>▼</button>
      <button class="btn-sm btn-remove" type="button" data-action="remove">✕</button>
    </div>
  `).join('');
  host.querySelectorAll('.btn-sm').forEach(btn => {
    btn.onclick = () => {
      const idx = +btn.closest('.resource-row').dataset.idx;
      const action = btn.dataset.action;
      if (action === 'up' && idx > 0) {
        [c.resources[idx], c.resources[idx - 1]] = [c.resources[idx - 1], c.resources[idx]];
      } else if (action === 'down' && idx < c.resources.length - 1) {
        [c.resources[idx], c.resources[idx + 1]] = [c.resources[idx + 1], c.resources[idx]];
      } else if (action === 'remove') {
        c.resources.splice(idx, 1);
      }
      renderResourceList();
    };
  });
}

// Populate the editor form with a character's data
function fillForm(c) {
  if (!c) return;
  const form = document.getElementById('char-form');
  form.hidden = false;
  form.name.value = c.name || '';
  form.class.value = c.class || 'Wizard';
  form.level.value = c.level || 1;
  form.ac.value = c.ac || '';
  form.hp.value = c.hp || '';
  form.speed.value = c.speed || 30;
  form.resist.value = c.resist || '';
  form.spellSaveDC.value = c.spellSaveDC || '';
  form.spellAttack.value = c.spellAttack || '';
  form.spellMod.value = c.spellMod || '';
  form.isSpellcaster.checked = c.isSpellcaster || false;
  form.autoSlots.checked = c.autoSlots !== false;
  if (!Array.isArray(c.resources)) c.resources = [];
  renderManualSlots(form.autoSlots.checked);
  updateSpellFields();
  renderResourceList();
}

// Render the 9 manual spell slot level inputs, either auto-filled or from stored values
function renderManualSlots(auto) {
  const host = document.getElementById('manual-slots');
  host.hidden = auto;
  const form = document.getElementById('char-form');
  const cls = form.class.value;
  const lvl = +form.level.value || 1;
  const c = state.characters.find(x => x.id === state.selectedId);
  const base = auto ? slotsForLevel(cls, lvl) : (c?.slots || slotsForLevel(cls, lvl) || [0,0,0,0,0,0,0,0,0]);
  host.innerHTML = Array.from({length: 9}, (_, i) => `
    <label>L${i+1}<input type="number" min="0" max="9" name="slot${i+1}" value="${base?.[i] ?? 0}" ${auto ? 'disabled' : ''}></label>
  `).join('');
}

// Show or hide spell-related fieldsets based on the isSpellcaster checkbox
function updateSpellFields() {
  const form = document.getElementById('char-form');
  const spellSlotsField = document.getElementById('spellslots-field');
  const spellcastingField = document.getElementById('spellcasting-field');
  const manualSlots = document.getElementById('manual-slots');
  const show = form.isSpellcaster.checked;
  spellSlotsField.hidden = !show;
  spellcastingField.hidden = !show;
  if (show) {
    if (form.autoSlots.checked) renderManualSlots(true);
    else renderManualSlots(false);
  } else {
    manualSlots.hidden = true;
    form.autoSlots.checked = false;
  }
}

// ---------- battle tab ----------
// Wire up battle name input and layout selector
function bindBattle() {
  const bn = document.getElementById('battle-name');
  bn.value = state.battleName;
  bn.oninput = () => { state.battleName = bn.value; save(); renderPrint(); };
  document.getElementById('layout').onchange = (e) => {
    state.layout = e.target.value;
    document.getElementById('print-area').className = `layout-${state.layout}`;
    renderPrint();
  };
}

// Render the pick-list checkboxes for selecting which characters appear on printed cards
function renderBattle() {
  const host = document.getElementById('pick-list');
  host.innerHTML = state.characters.map(c => `
    <label>
      <input type="checkbox" checked value="${c.id}">
      <span><strong>${escapeHtml(c.name || '(unnamed)')}</strong><br>
      <small>${escapeHtml(c.class || '')} ${c.level || ''}</small></span>
    </label>
  `).join('');
  host.querySelectorAll('input').forEach(i => {
    i.onchange = () => {
      if (i.checked) state.picked.add(i.value); else state.picked.delete(i.value);
      renderPrint();
    };
  });
  renderPrint();
}

// Render the printable card area: title + cards for un-picked characters
function renderPrint() {
  document.getElementById('battle-title').textContent = state.battleName ? `⚔ ${state.battleName} ⚔` : '';
  document.getElementById('print-area').className = `layout-${state.layout}`;
  const cards = document.getElementById('cards');
  const picked = state.characters.filter(c => !state.picked.has(c.id));
  cards.innerHTML = picked.map(renderCard).join('');
}

// ---------- card rendering ----------
// Generate n bubble spans; if x is true, render as crossed-out (used)
function bubbles(n, x = false) {
  if (!n || n <= 0) return '';
  return Array.from({length: n}, () => `<span class="bubble ${x ? 'x' : ''}"></span>`).join('');
}

// Render a single character's printable card HTML
function renderCard(c) {
  const slots = c.isSpellcaster
    ? (c.autoSlots === false && c.slots ? c.slots : slotsForLevel(c.class, c.level))
    : null;
  const slotHtml = (slots || []).map((n, i) =>
    n > 0 ? `<span class="slot-group"><span class="lvl">Level ${i+1}</span>${bubbles(n)}</span>` : ''
  ).filter(Boolean).join('');

  const resources = c.resources || [];
  const resHtml = resources.filter(r => r.name && r.count > 0).map(r => {
    const count = r.count;
    return `<div class="line"></div><div class="resource-row"><span class="res-name">${escapeHtml(r.name)}:</span>${
      count >= 20 ? `<span>∞</span>` : bubbles(Math.min(count, 12))
    }</div>`;
  }).join('');

  return `
    <div class="card">
      <div class="name-row">
        <span class="name">${escapeHtml(c.name || '')}</span>
      </div>
      <div class="stats">
        <div class="cell"><div class="lbl">Initiative</div><div class="val">&nbsp;</div></div>
        <div class="cell"><div class="lbl">AC</div><div class="val">${c.ac ?? ''}</div></div>
        <div class="cell"><div class="lbl">HP / ${c.hp ?? '___'}</div><div class="val">&nbsp;</div></div>
        <div class="cell"><div class="lbl">Temp HP</div><div class="val">&nbsp;</div></div>
      </div>
      <div class="kv"><span class="k">Speed</span><span class="v">${c.speed ?? ''}</span><span class="k">Resists</span><span class="v">${escapeHtml(c.resist || '')}</span></div>
      <div class="bottom-row">
        <span>Bardic <span class="bubble"></span> [d6]</span>
        <span>Reaction <span class="bubble"></span></span>
        <span class="death">
          <span>Death saves </span>
          ✓${bubbles(3)} &nbsp; ✗${bubbles(3, true)}
        </span>
      </div>
      <div class="kv"><span class="k">Conditions</span><span class="v"></span></div>
      ${slotHtml ? `<div class="line"></div><div class="slots">Spell spots: ${slotHtml}</div><div class="kv"><span class="k">Concentration</span><span class="v"></span><span class="k">Save DC</span><span class="v">${c.spellSaveDC ?? ''}</span><span class="k">Attack</span><span class="v">${c.spellAttack ?? ''}</span><span class="k">Mod</span><span class="v">${c.spellMod ?? ''}</span></div>` : ''}
      ${resHtml}
      <div class="notes-block">Notes</div>
    </div>
  `;
}

// ---------- export/import ----------
// Wire up JSON export (download) and import (file upload) buttons
function bindIO() {
  document.getElementById('export').onclick = () => {
    const blob = new Blob([JSON.stringify({
      characters: state.characters,
      battleName: state.battleName,
    }, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'battle-cards.json';
    a.click();
  };
  document.getElementById('import').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (Array.isArray(d.characters)) state.characters = d.characters;
        if (typeof d.battleName === 'string') state.battleName = d.battleName;
        save(); render(); renderBattle();
      } catch { alert('Invalid JSON'); }
    };
    r.readAsText(file);
  };
}

// ---------- settings ----------
function bindSettings() {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsOverlay = document.getElementById('settings-overlay');
  const closeSettingsBtn = document.getElementById('close-settings');

  settingsBtn.onclick = () => { settingsOverlay.hidden = false; };
  closeSettingsBtn.onclick = () => { settingsOverlay.hidden = true; };
  settingsOverlay.onclick = (e) => {
    if (e.target === settingsOverlay) settingsOverlay.hidden = true;
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !settingsOverlay.hidden) settingsOverlay.hidden = true;
  });
}

// ---------- utils ----------
// Escape HTML special characters to prevent XSS in rendered output
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
