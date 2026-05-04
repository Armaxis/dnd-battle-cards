// D&D class preset data: spell slot tables and class definitions.

// casterTypes defines spell slot progression for each caster category:
//   full    – levels 1-9, index 0-19 = character level 1-20
//   half    – half-casters get slots later and fewer at high levels
//   warlock – object format {slots, level} since all pact slots are the same level
const CLASSES_DATA = 
{
  "casterTypes": {
    "full": [
      [2,0,0,0,0,0,0,0,0],
      [3,0,0,0,0,0,0,0,0],
      [4,2,0,0,0,0,0,0,0],
      [4,3,0,0,0,0,0,0,0],
      [4,3,2,0,0,0,0,0,0],
      [4,3,3,0,0,0,0,0,0],
      [4,3,3,1,0,0,0,0,0],
      [4,3,3,2,0,0,0,0,0],
      [4,3,3,3,1,0,0,0,0],
      [4,3,3,3,2,0,0,0,0],
      [4,3,3,3,2,1,0,0,0],
      [4,3,3,3,2,1,0,0,0],
      [4,3,3,3,2,1,1,0,0],
      [4,3,3,3,2,1,1,0,0],
      [4,3,3,3,2,1,1,1,0],
      [4,3,3,3,2,1,1,1,0],
      [4,3,3,3,2,1,1,1,1],
      [4,3,3,3,3,1,1,1,1],
      [4,3,3,3,3,2,1,1,1],
      [4,3,3,3,3,2,2,1,1]
    ],
    "half": [
      [0,0,0,0,0,0,0,0,0],
      [2,0,0,0,0,0,0,0,0],
      [3,0,0,0,0,0,0,0,0],
      [3,0,0,0,0,0,0,0,0],
      [4,2,0,0,0,0,0,0,0],
      [4,2,0,0,0,0,0,0,0],
      [4,3,0,0,0,0,0,0,0],
      [4,3,0,0,0,0,0,0,0],
      [4,3,2,0,0,0,0,0,0],
      [4,3,2,0,0,0,0,0,0],
      [4,3,3,0,0,0,0,0,0],
      [4,3,3,0,0,0,0,0,0],
      [4,3,3,1,0,0,0,0,0],
      [4,3,3,1,0,0,0,0,0],
      [4,3,3,2,0,0,0,0,0],
      [4,3,3,2,0,0,0,0,0],
      [4,3,3,3,1,0,0,0,0],
      [4,3,3,3,1,0,0,0,0],
      [4,3,3,3,2,0,0,0,0],
      [4,3,3,3,2,0,0,0,0]
    ],
    "warlock": [
      {"slots":1,"level":1},
      {"slots":2,"level":1},
      {"slots":2,"level":2},
      {"slots":2,"level":2},
      {"slots":2,"level":3},
      {"slots":2,"level":3},
      {"slots":2,"level":4},
      {"slots":2,"level":4},
      {"slots":2,"level":5},
      {"slots":2,"level":5},
      {"slots":3,"level":5},
      {"slots":3,"level":5},
      {"slots":3,"level":5},
      {"slots":3,"level":5},
      {"slots":3,"level":5},
      {"slots":3,"level":5},
      {"slots":4,"level":5},
      {"slots":4,"level":5},
      {"slots":4,"level":5},
      {"slots":4,"level":5}
    ]
  },

  // Class definitions map to caster types.
  // caster: 'full' | 'half' | 'warlock' | 'none'
  "classes": {
    "Artificer": {
      "caster": "half"
    },
    "Barbarian": {
      "caster": "none"
    },
    "Bard": { 
      "caster": "full"
    },
    "Cleric": { "caster": "full" },
    "Druid": { "caster": "full" },
    "Fighter": {
      "caster": "none"
    },
    "Monk": {
      "caster": "none"
    },
    "Paladin": {
      "caster": "half"
    },
    "Ranger": { "caster": "half" },
    "Rogue": { "caster": "none" },
    "Sorcerer": {
      "caster": "full"
    },
    "Warlock": { "caster": "warlock" },
    "Wizard": {
      "caster": "full"
    }
  }
}
;
