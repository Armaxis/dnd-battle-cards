# D&D Battle Cards

A lightweight, offline-first web app for Dungeons & Dragons players and Dungeon Masters to create printable initiative-tracking battle cards for player characters.

![D&D Battle Cards](https://img.shields.io/badge/D&D-5e-purple) ![No Dependencies](https://img.shields.io/badge/dependencies-none-green) ![Offline First](https://img.shields.io/badge/offline-ready-blue)

## Features

- **Printable Battle Cards** — Generate professionally formatted cards for each character with all essential combat information
- **Spell Slot Tracking** — Automatic spell slot calculation based on class and level, with manual override option
- **Resource Management** — Track multiple class resources (e.g., Sorcery Points, Rage uses, etc.) with bubble checkboxes
- **Death Saves & Conditions** — Built-in tracking for death saves, conditions, concentration, and Bardic Inspiration
- **Offline First** — All data stored locally in browser's `localStorage`, no server required
- **Zero Dependencies** — Pure vanilla JavaScript, HTML, and CSS. No build step, no npm, no frameworks
- **Multiple Layout Options** — Choose between 6, 4, or 2 cards per page for printing

## Quick Start

1. Clone this repository or download the files
2. Open `index.html` in any modern web browser
3. Start adding characters!

```bash
git clone https://github.com/Armaxis/dnd-battle-cards.git
cd dnd-battle-cards
open index.html  # or just double-click index.html
```

## Print Output

Each character card includes:
- **Character Name** with death saves (✓/💀/✗)
- **Core Stats**: AC, HP, Speed, Initiative
- **Resistances & Conditions** tracking
- **Bardic Inspiration** and **Heroic Effort** checkboxes
- **Spellcasting** section (for spellcasters): Spell Save DC, Spell Attack, Spell Modifier, Concentration tracker, and Spell Slots with bubble checkboxes
- **Class Resources** with customizable names and bubble tracking
- **Notes area** for quick reminders

## File Structure

```
dnd-battle-cards/
├── index.html    — Main HTML layout (character list, editor form, printable zone)
├── style.css     — All styles including @media print rules
├── app.js        — Application logic (state management, rendering, persistence, I/O)
├── classes.js    — D&D class preset data (spell slot tables, caster type definitions)
└── LICENSE       — MIT License
```

## How to Use

### Adding Characters
1. Fill in the editor form on the right side
2. Enter character details: Name, Class, Level, AC, HP, Speed
3. Add any damage resistances
4. Toggle "Is Spellcaster" if applicable (reveals spellcasting fields)
5. Add class resources (e.g., "Sorcery Points: 4")
6. Click "Add Character"

### Managing Characters
- **Edit**: Click a character in the list to load into the editor
- **Delete**: Use the delete button next to each character
- **Reorder**: Characters appear in the order they were added

### Spell Slots
- **Auto Mode**: Automatically calculates slots based on class and level using D&D 5e rules
- **Manual Mode**: Override with custom slot values (useful for multiclassing or homebrew)

### Printing Battle Cards
1. Scroll to the bottom of the page
2. Enter a battle name (appears on printed cards)
3. Select which characters to include (uncheck to exclude)
4. Choose layout: 6, 4, or 2 cards per page
5. Click "Print" or use Ctrl+P / Cmd+P

## Supported Classes

All D&D 5e classes are supported with accurate spell slot progressions:

- **Full Casters**: Bard, Cleric, Druid, Sorcerer, Wizard
- **Half Casters**: Paladin, Ranger, Warlock (pact magic)
- **Non-Casters**: Barbarian, Fighter, Monk, Rogue
- **Special**: Artificer (half caster with unique progression)

## Data Persistence

All character data is automatically saved to your browser's `localStorage`. Data persists between sessions on the same device and browser. Clearing browser data will erase saved characters.

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the needs of D&D players who want quick, printable reference cards for combat
- Spell slot tables based on D&D 5th Edition System Reference Document (SRD)

---

**No installation. No registration. No internet required. Just open and play.**
