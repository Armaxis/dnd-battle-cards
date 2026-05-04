# D&D Battle Cards

## What This Project Is

A lightweight, offline-first web app for D&D players/DMs to create printable initiative-tracking battle cards for player characters. Characters are stored in `localStorage`. No build step, no dependencies — just open `index.html` in a browser.

## File Structure

```
index.html    – Main HTML layout (character list, editor form, printable zone)
style.css     – All styles including @media print rules
app.js        – All application logic (state, rendering, persistence, I/O)
classes.js    – D&D class preset data (spell slot tables, caster type definitions)
```

## Architecture

### State (`app.js`)
```js
state = {
  characters: [],       // Array of character objects
  selectedId: null,     // Currently selected/edited character ID
  battleName: '',       // Title shown on printed cards
  picked: new Set(),    // IDs of characters EXCLUDED from print
  layout: '6',          // '6' | '4' | '2' (cards per page)
}
```

### Character Object
```js
{
  id, name, class, level, ac, hp, speed, resist,
  isSpellcaster (bool),
  spellSaveDC, spellAttack, spellMod,
  autoSlots (bool), slots (array | null),
  resources: [{ name, count }, ...]
}
```

### Data Flow

1. **`classes.js`** defines `CLASSES_DATA` — caster types (full/half/warlock) with spell slot tables per level, and class definitions mapping to caster types
2. **`load()`** reads characters from `localStorage` on boot, runs `migrateChar()` to upgrade legacy data
3. **`render()`** draws the character list and fills the editor form
4. **`renderBattle()`** draws the pick-list checkboxes and calls `renderPrint()`
5. **`renderPrint()`** renders printable cards (characters NOT in `picked` set)
6. **`save()`** persists to `localStorage`

### Key Functions
| Function | Purpose |
|---|---|
| `render()` | Re-render list + editor form |
| `renderBattle()` | Re-render pick list + print area |
| `renderPrint()` | Re-render only the printable cards |
| `renderCard(c)` | Render a single character's printable card HTML |
| `fillForm(c)` | Populate form fields for a character |
| `migrateChar(c)` | Convert legacy character data to current schema |
| `collectResources()` | Read resource rows from DOM into array |
| `renderResourceList()` | Render dynamic resource rows with reorder/remove buttons |
| `updateSpellFields()` | Show/hide spell fieldsets based on `isSpellcaster` toggle |
| `renderManualSlots(auto)` | Render 9 spell slot inputs (auto or manual) |
| `slotsForLevel(className, level)` | Look up spell slot array from class presets |
| `isSpellcaster(className)` | Check if a class has spellcasting |
| `bubbles(n, x)` | Generate bubble checkbox spans for cards |
| `escapeHtml(s)` | Escape HTML special characters |

### Layout
- **Top row** (2-column grid): character list (left, 280px) + editor form (right)
- **Bottom row** (full width): battle controls + pick list + printable cards
- **Editor form order**: Name → Class/Level/AC/HP/Speed (5-col row) → Resist → Is Spellcaster toggle → Spellcasting fields (conditional) → Spell Slots (conditional) → Class Resources → Actions

## Form Features

### isSpellcaster Toggle
- Checkbox controls visibility of all spell-related fields
- When unchecked: Spellcasting fieldset and Spell Slots fieldset are hidden
- When checked: Shows Spell Save DC / Spell Attack / Spell Mod fields + Spell Slots section
- Defaults to `false` for new characters; inferred from class type during data migration

### Class Resources
- Multiple resources per character via dynamic add/remove/reorder rows
- Each resource: name + count (uses)
- "+ Add Resource" button creates new empty rows
- ▲▼ buttons reorder, ✕ button removes
- No auto-fill from class/level — always manually entered

### Spell Slots
- Auto-fill from class presets (based on caster type and level) or manual override
- Manual mode shows 9 level inputs (L1–L9)
- Warlock slots mapped to single pact slot level

## CSS Conventions

- No CSS framework — hand-written CSS with utility-style class names
- Print layout via `@media print` with `@page { size: letter; margin: 10mm }`
- `.no-print` class hides elements during printing
- Card grid controlled by `.layout-6`, `.layout-4`, `.layout-2` classes on `#print-area`
- `.resource-row` grid for resource editor rows
- `.row.spell-row` for 3-column spellcasting fields (vs default 5-col main row)

## Development Conventions

- **No build step** — edit files directly, refresh browser
- **No external dependencies** — vanilla JS, no frameworks
- **No comments in code** — keep code clean and self-documenting (exception: section dividers and method comments are acceptable)
- **localStorage key**: `dnd-battle-cards-v1`

## Print Output

Cards include: character name, AC, HP/temp HP, speed, resists, spell slots (as bubble checkboxes, only for spellcasters), spell Save DC / Attack / Mod, class resources (multiple, with bubble trackers), Bardic Inspiration tracker, reaction tracker, death saves (success/failure), concentration, conditions, and a notes area.

## Data Migration

`migrateChar()` handles backward compatibility:
- Adds `isSpellcaster` field (inferred from class caster type)
- Converts legacy `resourceName`/`resourceCount`/`autoResource` into `resources: []` array
- Deletes deprecated fields (`resourceName`, `resourceCount`, `autoResource`, `spellSave`, `saves`)
