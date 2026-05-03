const STORAGE_KEY = 'dnd-battle-cards-v1';
let CLASSES = null;
let state = {
  characters: [],
  selectedId: null,
  battleName: '',
  picked: new Set(),
  layout: '6',
};

// ---------- boot ----------
(function init() {
  CLASSES = CLASSES_DATA;
  load();
  buildClassOptions();
  bindTabs();
  bindForm();
  bindBattle();
  bindIO();
  render();
})();

// ---------- persistence ----------
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      state.characters = d.characters || [];
      state.battleName = d.battleName || '';
    }
  } catch {}
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    characters: state.characters,
    battleName: state.battleName,
  }));
}

// ---------- class presets ----------
function buildClassOptions() {
  const sel = document.getElementById('class-select');
  sel.innerHTML = Object.keys(CLASSES.classes)
    .map(c => `<option value="${c}">${c}</option>`).join('');
}

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

function resourceForLevel(className, level) {
  const res = CLASSES.classes[className]?.resource;
  if (!res) return null;
  const v = res.byLevel[level - 1];
  return { name: res.name, count: v };
}

// ---------- tabs ----------
function bindTabs() {
  document.querySelectorAll('header nav button').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('header nav button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const tab = b.dataset.tab;
      document.getElementById('library').hidden = tab !== 'library';
      document.getElementById('battle').hidden  = tab !== 'battle';
      document.body.classList.toggle('show-print', tab === 'battle');
      if (tab === 'battle') renderBattle();
    };
  });
}

// ---------- library ----------
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

function selectChar(id) {
  state.selectedId = id;
  render();
}

document.getElementById('new-char').onclick = () => {
  const c = {
    id: crypto.randomUUID(),
    name: '', class: 'Wizard', level: 1,
    ac: 10, hp: 8, speed: 30,
    saves: '', resist: '',
    autoSlots: true, slots: null,
    autoResource: true, resourceName: '', resourceCount: 0,
  };
  state.characters.push(c);
  state.selectedId = c.id;
  save(); render();
};

function bindForm() {
  const form = document.getElementById('char-form');
  const autoSlots = form.autoSlots;
  const classSel = form.class;
  const levelInput = form.level;
  const autoResource = form.autoResource;

  const refreshAuto = () => {
    if (autoSlots.checked) renderManualSlots(true);
    else renderManualSlots(false);
    updateResourceField();
  };

  classSel.onchange = refreshAuto;
  levelInput.oninput = refreshAuto;
  autoSlots.onchange = refreshAuto;
  autoResource.onchange = updateResourceField;

  form.onsubmit = (e) => {
    e.preventDefault();
    const c = state.characters.find(x => x.id === state.selectedId);
    if (!c) return;
    const fd = new FormData(form);
    Object.assign(c, {
      name: fd.get('name'),
      class: fd.get('class'),
      level: +fd.get('level'),
      ac: +fd.get('ac'),
      hp: +fd.get('hp'),
      speed: +fd.get('speed'),
      saves: fd.get('saves'),
      resist: fd.get('resist'),
      autoSlots: form.autoSlots.checked,
      autoResource: form.autoResource.checked,
      resourceName: fd.get('resourceName'),
      resourceCount: +fd.get('resourceCount') || 0,
    });
    if (!c.autoSlots) {
      c.slots = [];
      for (let i = 1; i <= 9; i++) c.slots.push(+form[`slot${i}`].value || 0);
    } else {
      c.slots = null;
    }
    save(); render();
  };

  document.getElementById('cancel-edit').onclick = () => {
    state.selectedId = null; render();
  };
  document.getElementById('delete-char').onclick = () => {
    if (!confirm('Delete this character?')) return;
    state.characters = state.characters.filter(c => c.id !== state.selectedId);
    state.selectedId = null;
    save(); render();
  };
}

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
  form.autoSlots.checked = c.autoSlots !== false;
  form.autoResource.checked = c.autoResource !== false;
  form.resourceName.value = c.resourceName || '';
  form.resourceCount.value = c.resourceCount || 0;
  renderManualSlots(form.autoSlots.checked);
  updateResourceField();
}

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

function updateResourceField() {
  const form = document.getElementById('char-form');
  const cls = form.class.value;
  const lvl = +form.level.value || 1;
  const preset = resourceForLevel(cls, lvl);
  const field = document.getElementById('resource-field');
  field.hidden = !preset;  
  form.resourceName.value = preset.name;
  form.resourceCount.value = preset.count === '∞' ? 99 : (preset.count || 0);
}

// ---------- battle tab ----------
function bindBattle() {
  const bn = document.getElementById('battle-name');
  bn.value = state.battleName;
  bn.oninput = () => { state.battleName = bn.value; save(); renderPrint(); };
  document.getElementById('layout').onchange = (e) => {
    state.layout = e.target.value;
    document.getElementById('print-area').className = `layout-${state.layout}`;
    renderPrint();
  };
  document.getElementById('print-btn').onclick = () => {
    renderPrint();
    window.print();
  };
}

function renderBattle() {
  const host = document.getElementById('pick-list');
  host.innerHTML = state.characters.map(c => `
    <label>
      <input type="checkbox" checked value="${c.id}"}>
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

function renderPrint() {
  document.getElementById('battle-title').textContent = state.battleName ? `⚔ ${state.battleName} ⚔` : '';
  document.getElementById('print-area').className = `layout-${state.layout}`;
  const cards = document.getElementById('cards');
  const picked = state.characters.filter(c => !state.picked.has(c.id));
  cards.innerHTML = picked.map(renderCard).join('');
}

// ---------- card rendering ----------
function bubbles(n, x = false) {
  if (!n || n <= 0) return '';
  return Array.from({length: n}, () => `<span class="bubble ${x ? 'x' : ''}"></span>`).join('');
}

function renderCard(c) {
  const slots = c.autoSlots === false && c.slots ? c.slots : slotsForLevel(c.class, c.level);
  const slotHtml = (slots || []).map((n, i) =>
    n > 0 ? `<span class="slot-group"><span class="lvl">Level ${i+1}</span>${bubbles(n)}</span>` : ''
  ).filter(Boolean).join('');

  const resCount = c.resourceCount;
  const resHtml = c.resourceName && resCount > 0
    ? `<div class="line"></div><div class="resource-row"><span class="res-name">${escapeHtml(c.resourceName)}:</span>${
        resCount >= 20 ? `<span>∞</span>` : bubbles(Math.min(resCount, 12))
      }</div>` : '';

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
          <span >Death saves </span>
          ✓${bubbles(3)} &nbsp; ✗${bubbles(3, true)}
        </span>
      </div>
      <div class="kv"><span class="k">Conditions</span><span class="v"></span></div>
      ${slotHtml ? `<div class="line"></div><div class="slots">Spell spots: ${slotHtml}</div><div class="kv"><span class="k">Concentration</span><span class="v"></span><span class="k">Spell Save</span><span class="v"></span></div>` : ''}
      ${resHtml}
      <div class="notes-block">Notes</div>
    </div>
  `;
}

// ---------- export/import ----------
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
        save(); render();
      } catch { alert('Invalid JSON'); }
    };
    r.readAsText(file);
  };
}

// ---------- utils ----------
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
