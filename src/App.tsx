import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'
import { armorCatalog, decorationCatalog, type ArmorPiece, type ArmorSlot, type Decoration } from './data/loadoutCatalog'

type WheelItem = {
  id: string
  name: string
  file: string
}

type MonsterVariant = 'normal' | 'tempered' | 'archTempered'
type WeightedItem = WheelItem & { weight: number; normal: boolean; tempered: boolean; archTempered: boolean }
type WheelOption = WheelItem & { variant: 'normal' | MonsterVariant; sourceId: string; weight: number }

type WheelProps = {
  title: string
  eyebrow: string
  folder: string
  items: WeightedItem[]
  enabled: boolean
  result: WheelOption | null
  spinning: boolean
  spinStart: number
  spinAngle: number
  accent: 'ember' | 'teal'
  onToggle: () => void
  onWeightChange: (id: string, weight: number) => void
  onVariantToggle: (id: string, variant: MonsterVariant, enabled: boolean) => void
  onToggleAllVariant: (variant: MonsterVariant | 'none' | 'regular') => void
  onSpin: () => void
}

const assetRoot = './assets'
const stateChannel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('monster-wheel-state')
const archTemperedMonsterIds = new Set(['arkveld', 'uth-duna', 'rey-dau', 'nu-udra', 'jin-dahaad'])
const noTemperedMonsterIds = new Set(['gogmazios'])

function getWheelOptions(items: WeightedItem[], showMonsterVariants: boolean) {
  return items.flatMap<WheelOption>((item) => {
    if (item.weight <= 0) return []
    const options: WheelOption[] = []
    if (item.normal) options.push({ ...item, variant: 'normal', sourceId: item.id })
    if (showMonsterVariants && item.tempered && !noTemperedMonsterIds.has(item.id)) options.push({ ...item, id: `${item.id}-tempered`, name: `${item.name} (Tempered)`, variant: 'tempered', sourceId: item.id })
    if (showMonsterVariants && item.archTempered) options.push({ ...item, id: `${item.id}-arch-tempered`, name: `${item.name} (Arch Tempered)`, variant: 'archTempered', sourceId: item.id })
    return options
  })
}

function weightedPick(items: WheelOption[]) {
  const activeItems = items.filter((item) => item.weight > 0)
  const totalWeight = activeItems.reduce((total, item) => total + item.weight, 0)
  let cursor = Math.random() * totalWeight

  for (const item of activeItems) {
    cursor -= item.weight
    if (cursor <= 0) return item
  }

  return activeItems[activeItems.length - 1]
}

function getOptionAngle(items: WheelOption[], id: string) {
  const totalWeight = items.reduce((total, item) => total + item.weight, 0)
  let angleCursor = 0
  for (const item of items) {
    const segment = (item.weight / totalWeight) * 360
    if (item.id === id) return angleCursor + segment / 2
    angleCursor += segment
  }
  return 0
}

function getLandingRotation(currentRotation: number, optionAngle: number) {
  const fullRotations = 1080 + Math.floor(Math.random() * 3) * 360
  const correction = ((-optionAngle - currentRotation) % 360 + 360) % 360
  return currentRotation + fullRotations + correction
}

function Wheel({
  title,
  eyebrow,
  folder,
  items,
  enabled,
  result,
  spinning,
  spinStart,
  spinAngle,
  accent,
  onToggle,
  onWeightChange,
  onVariantToggle,
  onToggleAllVariant,
  onSpin,
}: WheelProps) {
  const showMonsterVariants = folder === 'monsters'
  const activeItems = getWheelOptions(items, showMonsterVariants)
  const totalWeight = activeItems.reduce((total, item) => total + item.weight, 0)
  const sliceColors = ['#c95b32', '#f2c879', '#2d7772', '#e7a46d']
  const gradient = activeItems.length
    ? activeItems
        .map((item, index) => {
          const start = activeItems
            .slice(0, index)
            .reduce((total, entry) => total + (entry.weight / totalWeight) * 360, 0)
          const end = start + (item.weight / totalWeight) * 360
          const dividerStart = Math.max(start, end - 1.1)
          return `${sliceColors[index % sliceColors.length]} ${start}deg ${dividerStart}deg, #282921 ${dividerStart}deg ${end}deg`
        })
        .join(', ')
    : '#ded8ca 0deg 360deg'
  let angleCursor = 0
  const wheelIcons = activeItems.map((item) => {
    const segment = (item.weight / totalWeight) * 360
    const angle = angleCursor + segment / 2
    angleCursor += segment
    return { item, angle }
  })
  const iconSize = activeItems.length > 24 ? 20 : activeItems.length > 16 ? 30 : 40
  const iconRadius = activeItems.length > 24 ? 174 : 161

  return (
    <section className={`wheel-panel ${accent} ${enabled ? '' : 'is-disabled'}`}>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <button className={`toggle ${enabled ? 'is-on' : ''}`} onClick={onToggle} type="button" aria-pressed={enabled}>
          <span /> {enabled ? 'Active' : 'Off'}
        </button>
      </div>
      {showMonsterVariants && <div className="variant-toolbar">
        <span>Monster versions</span>
        <button type="button" onClick={() => onToggleAllVariant('normal')}>All</button>
        <button type="button" onClick={() => onToggleAllVariant('regular')}>All Regular</button>
        <button type="button" onClick={() => onToggleAllVariant('tempered')}>Only Tempered</button>
        <button type="button" onClick={() => onToggleAllVariant('archTempered')}>Only Arch Tempered</button>
        <button type="button" onClick={() => onToggleAllVariant('none')}>None</button>
      </div>}
      {!showMonsterVariants && <div className="variant-toolbar variant-toolbar-spacer" aria-hidden="true" />}

      <div className="wheel-stage">
        <div className={`pointer ${accent}`} />
        <div className={`wheel ${folder === 'monsters' ? 'monster-wheel' : ''}`}>
          <div className={`wheel-rotor ${spinning ? 'is-spinning' : ''}`} style={{ '--spin-start': `${spinStart}deg`, '--spin-angle': `${spinAngle}deg`, transform: `rotate(${spinAngle}deg)`, background: `conic-gradient(${gradient})` } as CSSProperties}>
            {wheelIcons.map(({ item, angle }) => (
              <div className={`wheel-icon ${item.variant === 'tempered' ? 'is-tempered' : ''} ${item.variant === 'archTempered' ? 'is-arch-tempered' : ''}`} key={item.id} style={{ '--angle': `${angle}deg`, '--icon-size': `${iconSize}px`, '--icon-radius': `${iconRadius}px` } as CSSProperties}>
                <img src={`${assetRoot}/${folder}/${item.file}`} alt={item.name} />
              </div>
            ))}
          </div>
          <div className="wheel-inner">
            {result ? <img className={result.variant === 'tempered' ? 'is-tempered' : result.variant === 'archTempered' ? 'is-arch-tempered' : ''} src={`${assetRoot}/${folder}/${result.file}`} alt="" /> : <span className="wheel-mark">?</span>}
            <strong>{result?.name ?? 'Ready'}</strong>
          </div>
        </div>
        <span className="wheel-caption">{activeItems.length} selected</span>
      </div>

      <button className="spin-button" type="button" onClick={onSpin} disabled={!enabled || activeItems.length === 0 || spinning}>
        <span className="spin-icon">↻</span>
        {spinning ? 'Rolling...' : `Spin ${title}`}
      </button>

      <div className="item-list">
        {showMonsterVariants && <div className="item-list-header" aria-hidden="true">
          <span />
          <span />
          <span />
          <span>Tempered</span>
          <span>Arch Tempered</span>
          <span />
          <span />
          <span />
        </div>}
        {items.map((item) => {
          const chance = totalWeight ? Math.round((item.weight / totalWeight) * 100) : 0
          const hasArchTempered = archTemperedMonsterIds.has(item.id)
          const isSelected = showMonsterVariants ? item.normal || item.tempered || item.archTempered : item.normal
          return (
            <label className={`item-row ${showMonsterVariants ? 'has-variants' : ''} ${isSelected ? 'is-selected' : ''} ${item.weight === 0 ? 'is-muted' : ''}`} key={item.id}>
              <img src={`${assetRoot}/${folder}/${item.file}`} alt="" />
              <span className="item-name">{item.name}</span>
              <input aria-label={`Include ${item.name}`} title="Normal" type="checkbox" checked={item.normal} onChange={(event) => onVariantToggle(item.id, 'normal', event.target.checked)} />
              {showMonsterVariants && <input aria-label={`Include ${item.name} Tempered`} title="Tempered" type="checkbox" disabled={noTemperedMonsterIds.has(item.id)} checked={item.tempered && !noTemperedMonsterIds.has(item.id)} onChange={(event) => onVariantToggle(item.id, 'tempered', event.target.checked)} />}
              {showMonsterVariants && <input aria-label={`Include ${item.name} Arch Tempered`} title="Arch Tempered" type="checkbox" disabled={!hasArchTempered} checked={item.archTempered} onChange={(event) => onVariantToggle(item.id, 'archTempered', event.target.checked)} />}
              <input aria-label={`${item.name} chance percent`} className="weight-input" type="number" min="0" value={item.weight} onChange={(event) => onWeightChange(item.id, Math.max(0, Number(event.target.value) || 0))} />
              <output>{chance}%</output>
            </label>
          )
        })}
      </div>
    </section>
  )
}

type Loadout = {
  name: string
  weaponId: string
  head: string
  chest: string
  arms: string
  waist: string
  legs: string
  charm: string
  skills: string
  notes: string
  decorations: string[]
}

const emptyLoadout: Loadout = { name: 'Wilds loadout', weaponId: '', head: '', chest: '', arms: '', waist: '', legs: '', charm: '', skills: '', notes: '', decorations: [] }

function LoadoutBuilder({ weapons }: { weapons: WeightedItem[] }) {
  const [loadout, setLoadout] = useState<Loadout>(emptyLoadout)
  const selectedWeapon = weapons.find((weapon) => weapon.id === loadout.weaponId)
  const updateField = (field: keyof Loadout, value: string) => setLoadout((current) => ({ ...current, [field]: value }))
  const armorSlots: Array<[ArmorSlot, string]> = [['head', 'Head'], ['chest', 'Chest'], ['arms', 'Arms'], ['waist', 'Waist'], ['legs', 'Legs']]
  const selectedArmor = armorSlots.map(([slot]) => armorCatalog.find((piece) => piece.id === loadout[slot] || piece.name === loadout[slot])).filter((piece): piece is ArmorPiece => Boolean(piece))
  const selectedDecorations = loadout.decorations.map((id) => decorationCatalog.find((decoration) => decoration.id === id || decoration.name === id)).filter((decoration): decoration is Decoration => Boolean(decoration))
  const defense = selectedArmor.reduce((total, piece) => total + piece.defense, 0)
  const resistances = (['fire', 'water', 'thunder', 'ice', 'dragon'] as const).map((element) => ({ element, value: selectedArmor.reduce((total, piece) => total + piece.resistances[element], 0) }))
  const skills = [...selectedArmor.flatMap((piece) => Object.entries(piece.skills)), ...selectedDecorations.flatMap((decoration) => decoration.skills.map(({ name, level }) => [name, level] as [string, number]))].reduce<Record<string, number>>((totals, [skill, level]) => ({ ...totals, [skill]: (totals[skill] ?? 0) + level }), {})
  const setArmor = (slot: ArmorSlot, value: string) => updateField(slot, value)
  const addDecoration = () => setLoadout((current) => ({ ...current, decorations: [...current.decorations, decorationCatalog[0].id] }))
  const removeDecoration = (index: number) => setLoadout((current) => ({ ...current, decorations: current.decorations.filter((_, itemIndex) => itemIndex !== index) }))

  return (
    <section className="builder-view">
      <div className="builder-heading">
        <div>
          <span className="eyebrow">Loadout bench / 02</span>
          <h1>Build your set.</h1>
          <p>Shape a Wilds loadout before you head into the field.</p>
        </div>
        <button className="builder-reset" type="button" onClick={() => setLoadout(emptyLoadout)}>Reset loadout</button>
      </div>

      <div className="builder-grid">
        <section className="builder-panel builder-identity">
          <span className="eyebrow">Loadout details</span>
          <label>Set name<input value={loadout.name} onChange={(event) => updateField('name', event.target.value)} /></label>
          <label>Weapon<select value={loadout.weaponId} onChange={(event) => updateField('weaponId', event.target.value)}>
            <option value="">Choose a weapon</option>
            {weapons.map((weapon) => <option value={weapon.id} key={weapon.id}>{weapon.name}</option>)}
          </select></label>
          <div className="builder-weapon-preview">
            {selectedWeapon ? <img src={`${assetRoot}/weapons/${selectedWeapon.file}`} alt={selectedWeapon.name} /> : <span>+</span>}
            <strong>{selectedWeapon?.name ?? 'No weapon selected'}</strong>
          </div>
        </section>

        <section className="builder-panel">
          <span className="eyebrow">Armor set</span>
          <div className="armor-grid">
            {armorSlots.map(([field, label]) => <label key={field}>{label}<select value={loadout[field]} onChange={(event) => setArmor(field, event.target.value)}><option value="">Choose {label.toLowerCase()}</option>{armorCatalog.filter((piece) => piece.slot === field).map((piece) => <option value={piece.id} key={piece.id}>{piece.name} · {piece.set} · Def {piece.defense}</option>)}</select></label>)}
          </div>
          <label>Charm<input value={loadout.charm} onChange={(event) => updateField('charm', event.target.value)} placeholder="Charm" /></label>
          <div className="decoration-editor"><div className="builder-subheading"><span>Decorations</span><button type="button" onClick={addDecoration}>+ Add</button></div>{loadout.decorations.map((decorationId, index) => <div className="decoration-row" key={`${index}-${decorationId}`}><select value={decorationId} onChange={(event) => setLoadout((current) => ({ ...current, decorations: current.decorations.map((item, itemIndex) => itemIndex === index ? event.target.value : item) }))}>{decorationCatalog.map((decoration) => <option value={decoration.id} key={decoration.id}>{decoration.name} · {decoration.skills.map((skill) => skill.name).join(', ')}</option>)}</select><button type="button" aria-label="Remove decoration" onClick={() => removeDecoration(index)}>×</button></div>)}</div>
        </section>

        <section className="builder-panel builder-totals"><span className="eyebrow">Armor totals</span><div className="stat-total"><strong>{defense}</strong><span>Defense</span></div><div className="resistance-grid">{resistances.map(({ element, value }) => <div key={element}><span>{element}</span><strong className={value < 0 ? 'negative' : ''}>{value > 0 ? `+${value}` : value}</strong></div>)}</div><div className="skill-total"><span>Active skills</span>{Object.keys(skills).length ? Object.entries(skills).map(([skill, level]) => <div key={skill}><strong>{skill}</strong><span>Lv. {level}</span></div>) : <small>Select armor or decorations to see totals.</small>}</div></section>

        <section className="builder-panel builder-notes">
          <span className="eyebrow">Build notes</span>
          <label>Extra skills<input value={loadout.skills} onChange={(event) => updateField('skills', event.target.value)} placeholder="Food skills or set bonuses" /></label>
          <label>Notes<textarea value={loadout.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Add decorations, food skills, or hunting notes" rows={5} /></label>
        </section>
      </div>
    </section>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState<'wheel' | 'builder'>('wheel')
  const [streamerOverlay, setStreamerOverlay] = useState(() => new URLSearchParams(window.location.search).has('overlay'))
  const [overlayWindowOpen, setOverlayWindowOpen] = useState(false)
  const [overlayAlwaysOnTop, setOverlayAlwaysOnTop] = useState(() => localStorage.getItem('monster-wheel-overlay-always-on-top') === 'true')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('monster-wheel-dark-mode') === 'true')
  const [monsters, setMonsters] = useState<WeightedItem[]>([])
  const [weapons, setWeapons] = useState<WeightedItem[]>([])
  const [monstersEnabled, setMonstersEnabled] = useState(true)
  const [weaponsEnabled, setWeaponsEnabled] = useState(true)
  const [monsterResult, setMonsterResult] = useState<WheelOption | null>(null)
  const [weaponResult, setWeaponResult] = useState<WheelOption | null>(null)
  const [spinningWheel, setSpinningWheel] = useState<'monster' | 'weapon' | 'both' | null>(null)
  const [spinAngles, setSpinAngles] = useState({ monster: 1440, weapon: 1440 })
  const [spinStarts, setSpinStarts] = useState({ monster: 1440, weapon: 1440 })
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`${assetRoot}/monsters/manifest.json`).then((response) => response.json()),
      fetch(`${assetRoot}/weapons/manifest.json`).then((response) => response.json()),
    ]).then(([monsterManifest, weaponManifest]) => {
      setMonsters(monsterManifest.map((item: WheelItem) => ({ ...item, weight: 50, normal: true, tempered: false, archTempered: false })))
      setWeapons(weaponManifest.map((item: WheelItem) => ({ ...item, weight: 50, normal: true, tempered: false, archTempered: false })))
    })
  }, [])

  const activeWheelCount = Number(monstersEnabled) + Number(weaponsEnabled)
  const loaded = monsters.length > 0 && weapons.length > 0
  const summary = useMemo(() => {
    if (monsterResult && weaponResult) return `${monsterResult.name} with ${weaponResult.name}`
    return monsterResult?.name ?? weaponResult?.name ?? 'No hunt rolled yet'
  }, [monsterResult, weaponResult])

  const updateWeight = (type: 'monster' | 'weapon', id: string, weight: number) => {
    const setter = type === 'monster' ? setMonsters : setWeapons
    setter((current) => current.map((item) => (item.id === id ? { ...item, weight } : item)))
  }

  const updateVariant = (type: 'monster' | 'weapon', id: string, variant: MonsterVariant, enabled: boolean) => {
    const setter = type === 'monster' ? setMonsters : setWeapons
    setter((current) => current.map((item) => item.id === id ? { ...item, [variant]: enabled, weight: variant === 'normal' && enabled && item.weight === 0 ? 50 : item.weight } : item))
  }

  const toggleAllMonsterVariants = (variant: MonsterVariant | 'none' | 'regular') => {
    setMonsters((current) => {
      if (variant === 'none') return current.map((item) => ({ ...item, normal: false, tempered: false, archTempered: false }))
      if (variant === 'normal') return current.map((item) => ({ ...item, normal: true, tempered: !noTemperedMonsterIds.has(item.id), archTempered: archTemperedMonsterIds.has(item.id) }))
      if (variant === 'regular') return current.map((item) => ({ ...item, normal: true, tempered: false, archTempered: false }))
      if (variant === 'tempered') return current.map((item) => ({ ...item, normal: false, tempered: !noTemperedMonsterIds.has(item.id), archTempered: false }))
      return current.map((item) => ({ ...item, normal: false, tempered: false, archTempered: archTemperedMonsterIds.has(item.id) }))
    })
  }

  const spin = (wheel: 'monster' | 'weapon' | 'both') => {
    if (spinningWheel || !loaded || activeWheelCount === 0) return
    const monsterOptions = getWheelOptions(monsters, true)
    const weaponOptions = getWheelOptions(weapons, false)
    const nextMonster = (wheel === 'weapon' || !monstersEnabled) ? monsterResult : weightedPick(monsterOptions)
    const nextWeapon = (wheel === 'monster' || !weaponsEnabled) ? weaponResult : weightedPick(weaponOptions)
    const monsterAngle = nextMonster ? getOptionAngle(monsterOptions, nextMonster.id) : 0
    const weaponAngle = nextWeapon ? getOptionAngle(weaponOptions, nextWeapon.id) : 0
    setSpinStarts(spinAngles)
    setSpinAngles({
      monster: wheel === 'weapon' ? spinAngles.monster : getLandingRotation(spinAngles.monster, monsterAngle),
      weapon: wheel === 'monster' ? spinAngles.weapon : getLandingRotation(spinAngles.weapon, weaponAngle),
    })
    setSpinningWheel(wheel)
    window.setTimeout(() => {
      if (wheel !== 'weapon') setMonsterResult(nextMonster)
      if (wheel !== 'monster') setWeaponResult(nextWeapon)
      const label = [nextMonster?.name, nextWeapon?.name].filter(Boolean).join(' + ')
      setHistory((current) => [label, ...current].slice(0, 4))
      setSpinningWheel(null)
    }, 2200)
  }

  useEffect(() => {
    const handleStateMessage = (event: MessageEvent) => {
      if (event.data?.type === 'request-state' && !streamerOverlay) {
        stateChannel?.postMessage({ type: 'state', state: { monsters, weapons, monstersEnabled, weaponsEnabled, monsterResult, weaponResult, spinningWheel, spinAngles, spinStarts } })
      }
      if (event.data?.type === 'spin-request' && !streamerOverlay) spin('both')
      if (event.data?.type === 'state' && streamerOverlay) {
        setMonsters(event.data.state.monsters)
        setWeapons(event.data.state.weapons)
        setMonstersEnabled(event.data.state.monstersEnabled)
        setWeaponsEnabled(event.data.state.weaponsEnabled)
        setMonsterResult(event.data.state.monsterResult)
        setWeaponResult(event.data.state.weaponResult)
        setSpinningWheel(event.data.state.spinningWheel)
        setSpinAngles(event.data.state.spinAngles)
        setSpinStarts(event.data.state.spinStarts)
      }
    }
    stateChannel?.addEventListener('message', handleStateMessage)
    if (streamerOverlay) stateChannel?.postMessage({ type: 'request-state' })
    return () => stateChannel?.removeEventListener('message', handleStateMessage)
  }, [streamerOverlay, monsters, weapons, monstersEnabled, weaponsEnabled, monsterResult, weaponResult, spinningWheel, spinAngles, spinStarts])

  useEffect(() => {
    if (!streamerOverlay) stateChannel?.postMessage({ type: 'state', state: { monsters, weapons, monstersEnabled, weaponsEnabled, monsterResult, weaponResult, spinningWheel, spinAngles, spinStarts } })
  }, [streamerOverlay, monsters, weapons, monstersEnabled, weaponsEnabled, monsterResult, weaponResult, spinningWheel, spinAngles, spinStarts])

  useEffect(() => {
    localStorage.setItem('monster-wheel-dark-mode', String(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('monster-wheel-overlay-always-on-top', String(overlayAlwaysOnTop))
  }, [overlayAlwaysOnTop])

  useEffect(() => {
    const handleOverlayKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setStreamerOverlay(false)
      if (streamerOverlay && event.code === 'Space' && event.target instanceof HTMLElement && !['INPUT', 'BUTTON'].includes(event.target.tagName)) {
        event.preventDefault()
        stateChannel?.postMessage({ type: 'spin-request' })
      }
    }
    window.addEventListener('keydown', handleOverlayKeys)
    return () => window.removeEventListener('keydown', handleOverlayKeys)
  }, [streamerOverlay, spinningWheel, loaded, activeWheelCount, monsters, weapons, monstersEnabled, weaponsEnabled, monsterResult, weaponResult])

  return (
    <main className={`app-shell ${streamerOverlay ? 'overlay-mode' : ''} ${darkMode ? 'dark-mode' : ''}`}>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">MW</span><span>Monster Wheel</span></div>
        <nav className="view-tabs" aria-label="Main navigation">
          <button className={activeTab === 'wheel' ? 'is-active' : ''} type="button" onClick={() => setActiveTab('wheel')}>Wheel</button>
          <button className={activeTab === 'builder' ? 'is-active' : ''} type="button" onClick={() => setActiveTab('builder')}>Loadout Builder</button>
        </nav>
        <div className="topbar-actions">
          <button className={`theme-toggle ${darkMode ? 'is-on is-selected' : ''}`} type="button" onClick={() => setDarkMode((value) => !value)} aria-pressed={darkMode}>
            <i /> {darkMode ? 'Light mode' : 'Dark mode'}
          </button>
          <button className={`overlay-toggle ${overlayAlwaysOnTop ? 'is-on' : ''}`} type="button" onClick={() => setOverlayAlwaysOnTop((value) => !value)} aria-pressed={overlayAlwaysOnTop}>
            <i /> Keep on top
          </button>
          <button className={`overlay-toggle ${overlayWindowOpen ? 'is-selected' : ''}`} type="button" onClick={() => { const overlayWindow = window.open(`${window.location.origin}/?overlay=1${overlayAlwaysOnTop ? '&stay=1' : ''}`, 'monster-wheel-streamer-overlay', 'popup,width=900,height=520'); overlayWindow?.focus(); setOverlayWindowOpen(true) }}>
            <i /> Streamer overlay
          </button>
          <span className="status"><i /> Wilds hunt generator</span>
        </div>
      </header>

      {activeTab === 'builder' ? <LoadoutBuilder weapons={weapons} /> : <>
      <section className="intro">
        <div>
          <span className="eyebrow">Field dispatch / 01</span>
          <h1>Roll your next hunt.</h1>
          <p>Set your odds, spin the wheels, and let the Guild pick the assignment.</p>
        </div>
        <div className="hunt-summary"><span>Current assignment</span><strong>{summary}</strong></div>
      </section>

      <section className="wheel-grid">
        <Wheel title="Monster" eyebrow="Target wheel" folder="monsters" items={monsters} enabled={monstersEnabled} result={monsterResult} spinning={spinningWheel === 'monster' || spinningWheel === 'both'} spinStart={spinStarts.monster} spinAngle={spinAngles.monster} accent="ember" onToggle={() => setMonstersEnabled((value) => !value)} onWeightChange={(id, weight) => updateWeight('monster', id, weight)} onVariantToggle={(id, variant, enabled) => updateVariant('monster', id, variant, enabled)} onToggleAllVariant={toggleAllMonsterVariants} onSpin={() => spin('monster')} />
        <Wheel title="Weapon" eyebrow="Loadout wheel" folder="weapons" items={weapons} enabled={weaponsEnabled} result={weaponResult} spinning={spinningWheel === 'weapon' || spinningWheel === 'both'} spinStart={spinStarts.weapon} spinAngle={spinAngles.weapon} accent="teal" onToggle={() => setWeaponsEnabled((value) => !value)} onWeightChange={(id, weight) => updateWeight('weapon', id, weight)} onVariantToggle={(id, variant, enabled) => updateVariant('weapon', id, variant, enabled)} onToggleAllVariant={() => undefined} onSpin={() => spin('weapon')} />
      </section>

      <section className="command-bar">
        <div><span className="eyebrow">Ready check</span><strong>{activeWheelCount} of 2 wheels active</strong></div>
        <button className="primary-action" type="button" onClick={() => spin('both')} disabled={!loaded || activeWheelCount === 0 || Boolean(spinningWheel)}><span>↻</span>{spinningWheel ? 'Rolling assignment...' : 'Roll full assignment'}</button>
      </section>

      <section className="history"><div><span className="eyebrow">Recent rolls</span><h2>Hunt log</h2></div><div className="history-list">{history.length ? history.map((entry, index) => <span key={`${entry}-${index}`}>{String(index + 1).padStart(2, '0')} / {entry}</span>) : <span className="empty-log">Your rolled assignments will appear here.</span>}</div></section>
      </>}
      <footer>Monster Wheel / Built for spontaneous Wilds hunts</footer>
    </main>
  )
}

export default App
