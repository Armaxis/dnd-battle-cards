# D&D Battle Cards

## What This Project Is

A lightweight, offline-first web app for D&D players/DMs to create printable initiative-tracking battle cards for player characters. Characters are stored in `localStorage`. No build step, no dependencies — just open `index.html` in a browser.

## File Structure

```
index.html    – Main HTML layout (character list, editor form, printable zone)
style.css     – All styles including @media print rules
app.js        – All application logic (state, rendering, persistence, I/O)
classes.js    – D&D class preset data (spell slot tables, class resources)
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
  id, name, class, level, ac, hp, speed,
  resist, spellSave,
  autoSlots (bool), slots (array| null),
  autoResource (bool), resourceName, resourceCount
}
```

### Data Flow

1. **`classes.js`** defines `CLASSES_DATA` — caster types (full/half/warlock), spell slot tables per level, and class resources (Rage, Ki, Bardic Inspiration, etc.)
2. **`load()`** reads characters from `localStorage` on boot
3. **`render()`** draws the character list and fills the editor form
4. **`renderBattle()`** draws the pick-list checkboxes and calls `renderPrint()`
5. **`renderPrint()`** renders printable cards (characters NOT in `picked` set)
6. **`save()`** persists to `localStorage`

### Key Functions
| Function | Purpose |
|---|---|
| `render()` | Re-render list + editor |
| `renderBattle()` | Re-render pick list + print area |
| `renderPrint()` | Re-render only the printable cards |
| `fillForm(c)` | Populate form fields for a character |
| `snapshotForm()` | Capture current form state for dirty tracking |
| `markDirty()` | Flag changed fields with `.dirty` class + show "Unsaved" badge |
| `clearDirty()` | Remove dirty indicators |

### Layout
- **Top row** (2-column grid): character list (left, 280px) + editor form (right)
- **Bottom row** (full width): battle controls + pick list + printable cards

### Dirty State (Unsaved Changes)
- Form fields get `.dirty` class (red border, pink background) when modified
- An "Unsaved" badge appears above action buttons
- Cleared on Save, Cancel, or Delete

## CSS Conventions

- No CSS framework — hand-written CSS with utility-style class names
- Print layout via `@media print` with `@page { size: letter; margin: 10mm }`
- `.no-print` class hides elements during printing
- Card grid controlled by `.layout-6`, `.layout-4`, `.layout-2` classes on `#print-area`

## Development Conventions

- **No build step** — edit files directly, refresh browser
- **No external dependencies** — vanilla JS, no frameworks
- **No comments in code** — keep code clean and self-documenting
- **localStorage key**: `dnd-battle-cards-v1`

## Print Output

Cards include: character name, AC, HP/temp HP, speed, resists, spell slots (as bubble checkboxes), class resources (Ki, Bardic Inspiration, etc.), Bardic Inspiration tracker, reaction tracker, death saves, concentration, spell save DC, conditions, and a notes area.
