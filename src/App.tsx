import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'

type WheelItem = {
  id: string
  name: string
  file: string
}

type WeightedItem = WheelItem & { weight: number }

type WheelProps = {
  title: string
  eyebrow: string
  folder: string
  items: WeightedItem[]
  enabled: boolean
  result: WheelItem | null
  spinning: boolean
  accent: 'ember' | 'teal'
  onToggle: () => void
  onWeightChange: (id: string, weight: number) => void
  onSpin: () => void
}

const assetRoot = './assets'

function weightedPick(items: WeightedItem[]) {
  const activeItems = items.filter((item) => item.weight > 0)
  const totalWeight = activeItems.reduce((total, item) => total + item.weight, 0)
  let cursor = Math.random() * totalWeight

  for (const item of activeItems) {
    cursor -= item.weight
    if (cursor <= 0) return item
  }

  return activeItems[activeItems.length - 1]
}

function Wheel({
  title,
  eyebrow,
  folder,
  items,
  enabled,
  result,
  spinning,
  accent,
  onToggle,
  onWeightChange,
  onSpin,
}: WheelProps) {
  const activeItems = items.filter((item) => item.weight > 0)
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

      <div className="wheel-stage">
        <div className={`pointer ${accent}`} />
        <div className="wheel">
          <div className={`wheel-rotor ${spinning ? 'is-spinning' : ''}`} style={{ background: `conic-gradient(${gradient})` }}>
            {wheelIcons.map(({ item, angle }) => (
              <div className="wheel-icon" key={item.id} style={{ '--angle': `${angle}deg` } as CSSProperties}>
                <img src={`${assetRoot}/${folder}/${item.file}`} alt={item.name} />
              </div>
            ))}
          </div>
          <div className="wheel-inner">
            {result ? <img src={`${assetRoot}/${folder}/${result.file}`} alt="" /> : <span className="wheel-mark">?</span>}
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
        {items.map((item) => {
          const chance = totalWeight ? Math.round((item.weight / totalWeight) * 100) : 0
          return (
            <label className={`item-row ${item.weight === 0 ? 'is-muted' : ''}`} key={item.id}>
              <img src={`${assetRoot}/${folder}/${item.file}`} alt="" />
              <span className="item-name">{item.name}</span>
              <input aria-label={`Include ${item.name}`} type="checkbox" checked={item.weight > 0} onChange={(event) => onWeightChange(item.id, event.target.checked ? 50 : 0)} />
              <input aria-label={`${item.name} chance percent`} className="weight-input" type="number" min="0" value={item.weight} onChange={(event) => onWeightChange(item.id, Math.max(0, Number(event.target.value) || 0))} />
              <output>{chance}%</output>
            </label>
          )
        })}
      </div>
    </section>
  )
}

function App() {
  const [streamerOverlay, setStreamerOverlay] = useState(() => new URLSearchParams(window.location.search).has('overlay'))
  const [monsters, setMonsters] = useState<WeightedItem[]>([])
  const [weapons, setWeapons] = useState<WeightedItem[]>([])
  const [monstersEnabled, setMonstersEnabled] = useState(true)
  const [weaponsEnabled, setWeaponsEnabled] = useState(true)
  const [monsterResult, setMonsterResult] = useState<WheelItem | null>(null)
  const [weaponResult, setWeaponResult] = useState<WheelItem | null>(null)
  const [spinningWheel, setSpinningWheel] = useState<'monster' | 'weapon' | 'both' | null>(null)
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setStreamerOverlay(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    Promise.all([
      fetch(`${assetRoot}/monsters/manifest.json`).then((response) => response.json()),
      fetch(`${assetRoot}/weapons/manifest.json`).then((response) => response.json()),
    ]).then(([monsterManifest, weaponManifest]) => {
      setMonsters(monsterManifest.map((item: WheelItem) => ({ ...item, weight: 50 })))
      setWeapons(weaponManifest.map((item: WheelItem) => ({ ...item, weight: 50 })))
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

  const spin = (wheel: 'monster' | 'weapon' | 'both') => {
    if (spinningWheel || !loaded || activeWheelCount === 0) return
    setSpinningWheel(wheel)
    window.setTimeout(() => {
      const nextMonster = (wheel === 'weapon' || !monstersEnabled) ? monsterResult : weightedPick(monsters)
      const nextWeapon = (wheel === 'monster' || !weaponsEnabled) ? weaponResult : weightedPick(weapons)
      if (wheel !== 'weapon') setMonsterResult(nextMonster)
      if (wheel !== 'monster') setWeaponResult(nextWeapon)
      const label = [nextMonster?.name, nextWeapon?.name].filter(Boolean).join(' + ')
      setHistory((current) => [label, ...current].slice(0, 4))
      setSpinningWheel(null)
    }, 2200)
  }

  return (
    <main className={`app-shell ${streamerOverlay ? 'overlay-mode' : ''}`}>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">MW</span><span>Monster Wheel</span></div>
        <div className="topbar-actions">
          <button className={`overlay-toggle ${streamerOverlay ? 'is-on' : ''}`} type="button" onClick={() => setStreamerOverlay((value) => !value)} aria-pressed={streamerOverlay}>
            <i /> Streamer overlay
          </button>
          <span className="status"><i /> Wilds hunt generator</span>
        </div>
      </header>

      <section className="intro">
        <div>
          <span className="eyebrow">Field dispatch / 01</span>
          <h1>Roll your next hunt.</h1>
          <p>Set your odds, spin the wheels, and let the Guild pick the assignment.</p>
        </div>
        <div className="hunt-summary"><span>Current assignment</span><strong>{summary}</strong></div>
      </section>

      <section className="wheel-grid">
        <Wheel title="Monster" eyebrow="Target wheel" folder="monsters" items={monsters} enabled={monstersEnabled} result={monsterResult} spinning={spinningWheel === 'monster' || spinningWheel === 'both'} accent="ember" onToggle={() => setMonstersEnabled((value) => !value)} onWeightChange={(id, weight) => updateWeight('monster', id, weight)} onSpin={() => spin('monster')} />
        <Wheel title="Weapon" eyebrow="Loadout wheel" folder="weapons" items={weapons} enabled={weaponsEnabled} result={weaponResult} spinning={spinningWheel === 'weapon' || spinningWheel === 'both'} accent="teal" onToggle={() => setWeaponsEnabled((value) => !value)} onWeightChange={(id, weight) => updateWeight('weapon', id, weight)} onSpin={() => spin('weapon')} />
      </section>

      <section className="command-bar">
        <div><span className="eyebrow">Ready check</span><strong>{activeWheelCount} of 2 wheels active</strong></div>
        <button className="primary-action" type="button" onClick={() => spin('both')} disabled={!loaded || activeWheelCount === 0 || Boolean(spinningWheel)}><span>↻</span>{spinningWheel ? 'Rolling assignment...' : 'Roll full assignment'}</button>
      </section>

      <section className="history"><div><span className="eyebrow">Recent rolls</span><h2>Hunt log</h2></div><div className="history-list">{history.length ? history.map((entry, index) => <span key={`${entry}-${index}`}>{String(index + 1).padStart(2, '0')} / {entry}</span>) : <span className="empty-log">Your rolled assignments will appear here.</span>}</div></section>
      <footer>Monster Wheel / Built for spontaneous Wilds hunts</footer>
    </main>
  )
}

export default App
