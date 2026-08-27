export type ArmorSlot = 'head' | 'chest' | 'arms' | 'waist' | 'legs'

export type ArmorPiece = {
  id: string
  name: string
  set: string
  slot: ArmorSlot
  defense: number
  resistances: { fire: number; water: number; thunder: number; ice: number; dragon: number }
  skills: Record<string, number>
  source: string
}

export type Decoration = {
  id: string
  name: string
  slot: number
  skills: Array<{ name: string; level: number }>
  source: string
}

import wikiCatalog from './wikiCatalog.json'

type WikiDecoration = { id: string; name: string; slot: number; skills: string[]; levels: number[]; source: string }

const alloySkills = { 'Tremor Resistance': 1 }
const alloyResistance = { fire: -2, water: 1, thunder: -2, ice: -2, dragon: 1 }

const fallbackArmor: ArmorPiece[] = (['head', 'chest', 'arms', 'waist', 'legs'] as ArmorSlot[]).map((slot) => ({
  id: `alloy-${slot}`,
  name: `Alloy ${slot === 'head' ? 'Helm' : slot === 'chest' ? 'Mail' : slot === 'arms' ? 'Vambraces' : slot === 'waist' ? 'Coil' : 'Greaves'}`,
  set: 'Alloy',
  slot,
  defense: 6,
  resistances: alloyResistance,
  skills: alloySkills,
  source: 'Monster Hunter Wiki: Alloy Set (MHWilds)',
}))

export const armorCatalog: ArmorPiece[] = wikiCatalog.armor.length ? wikiCatalog.armor as ArmorPiece[] : fallbackArmor

const fallbackDecorations: Decoration[] = [
  { id: 'attack-jewel', name: 'Attack Jewel [1]', slot: 1, skills: [{ name: 'Attack Boost', level: 1 }], source: 'Monster Hunter Wiki: Decorations (MHWilds)' },
  { id: 'critical-jewel', name: 'Critical Jewel [1]', slot: 1, skills: [{ name: 'Critical Eye', level: 1 }], source: 'Monster Hunter Wiki: Decorations (MHWilds)' },
  { id: 'vitality-jewel', name: 'Vitality Jewel [1]', slot: 1, skills: [{ name: 'Health Boost', level: 1 }], source: 'Monster Hunter Wiki: Decorations (MHWilds)' },
  { id: 'fortitude-jewel', name: 'Fortitude Jewel [1]', slot: 1, skills: [{ name: 'Fortify', level: 1 }], source: 'Monster Hunter Wiki: Decorations (MHWilds)' },
]

export const decorationCatalog: Decoration[] = wikiCatalog.decorations.length
  ? (wikiCatalog.decorations as WikiDecoration[]).map((decoration) => ({ id: decoration.id, name: decoration.name, slot: decoration.slot, skills: decoration.skills.map((name, index) => ({ name, level: decoration.levels[index] ?? 1 })), source: decoration.source }))
  : fallbackDecorations