import { mkdir, writeFile } from 'node:fs/promises'
import * as cheerio from 'cheerio'

const api = 'https://monsterhunterwiki.org/api.php'
const pages = process.argv.slice(2)
const slots = ['head', 'chest', 'arms', 'waist', 'legs']

async function fetchHtml(title) {
  const url = `${api}?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json`
  const response = await fetch(url, { headers: { 'User-Agent': 'MonsterWheelDataImporter/1.0' } })
  if (!response.ok) throw new Error(`${title}: HTTP ${response.status}`)
  const payload = await response.json()
  if (payload.error) throw new Error(`${title}: ${payload.error.info}`)
  return payload.parse.text['*']
}

function numbers(text) {
  return [...text.matchAll(/-?\d+/g)].map((match) => Number(match[0]))
}

function inferSlot(name) {
  const normalized = name.toLowerCase()
  if (/helm|head|mask|crown|hood|specs|visor|earring|shades|circlet/.test(normalized)) return 'head'
  if (/mail|chest|vest|suit|armor|coat|shroud|jacket|robe|tronco/.test(normalized)) return 'chest'
  if (/vambrace|brace|arm|glove|gauntlet|cuff|bracia|wraps|grip/.test(normalized)) return 'arms'
  if (/coil|waist|belt|sash|wrap|flanchard|overlay|bowels|obi/.test(normalized)) return 'waist'
  if (/greave|leg|boot|pants|sandal|heel|boots|hakama|crura/.test(normalized)) return 'legs'
  return null
}

async function discoverSetPages() {
  const html = await fetchHtml('MHWilds/Armor')
  const $ = cheerio.load(html)
  return [...new Set($('a[href^="/wiki/"]').map((_, link) => decodeURIComponent($(link).attr('href').slice(6)).replace(/_/g, ' ')).get())]
    .filter((title) => / Set \(MHWilds\)$/i.test(title))
}

function parseSet(title, html) {
  const $ = cheerio.load(html)
  const set = title.replace(/ Set \(MHWilds\)$/i, '')
  const armor = []
  $('table').each((index, table) => {
    const text = $(table).text().replace(/\s+/g, ' ').trim()
    if (!/Lv/i.test(text) || numbers(text).length < 7 || armor.length >= slots.length) return
    const levelRow = text.match(/Lv\.?\s*1\s+Lv\.?\s*11\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)/i)
    const values = numbers(text)
    const defense = levelRow ? Number(levelRow[1]) : values[2] ?? 0
    const resistances = levelRow ? levelRow.slice(3, 8).map(Number) : values.slice(4, 9)
    const heading = $(table).find('a[href*="_(MHWilds)"]').first().text().replace(/\s+/g, ' ').trim()
    const pieceName = heading || `${set} ${slots[armor.length]}`
    const slot = inferSlot(pieceName) ?? slots[armor.length]
    armor.push({
      id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${slot}-${armor.length}`,
      name: pieceName,
      set,
      slot,
      defense,
      resistances: { fire: resistances[0] ?? 0, water: resistances[1] ?? 0, thunder: resistances[2] ?? 0, ice: resistances[3] ?? 0, dragon: resistances[4] ?? 0 },
      skills: Object.fromEntries($(table).find('a[href*="Skill"]').map((_, link) => [$(link).text().replace(/\s+/g, ' ').trim(), 1]).get().filter(([name]) => name)),
      source: `Monster Hunter Wiki: ${title}`,
    })
  })
  return armor
}

function parseDecorations(html) {
  const $ = cheerio.load(html)
  const decorations = []
  $('table').each((_, table) => {
    const heading = $(table).prevAll('h1, h2, h3, h4').first().text().replace(/\s+/g, ' ').trim()
    const slotMatch = heading.match(/Slot Level (\d)/i)
    const slot = slotMatch ? Number(slotMatch[1]) : 0
    if (!slot) return
    $(table).find('tr').slice(1).each((rowIndex, row) => {
      const cells = $(row).find('td')
      if (cells.length < 3) return
      const name = $(cells[0]).find('a').last().text().replace(/\s+/g, ' ').trim() || $(cells[0]).text().replace(/\s+/g, ' ').trim()
      const skill = $(cells[2]).find('a').map((__, link) => $(link).text().replace(/\s+/g, ' ').trim()).get().filter(Boolean)
      const level = Number($(cells[3]).text().match(/\d+/)?.[0] ?? 1)
      if (!name || !skill.length) return
      decorations.push({ id: `${name}-${slot}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: `${name} [${slot}]`, slot, skills: skill, levels: skill.map(() => level), source: 'Monster Hunter Wiki: MHWilds/Decorations' })
    })
  })
  return decorations
}

const armor = []
const setPages = pages.length ? pages : await discoverSetPages()
const results = await Promise.all(setPages.map(async (page) => {
  try {
    return parseSet(page, await fetchHtml(page))
  } catch (error) {
    console.warn(`Skipped ${page}: ${error.message}`)
    return []
  }
}))
armor.push(...results.flat())
const decorations = parseDecorations(await fetchHtml('MHWilds/Decorations'))
await mkdir('src/data', { recursive: true })
await writeFile('src/data/wikiCatalog.json', `${JSON.stringify({ generatedAt: new Date().toISOString(), source: api, armor, decorations }, null, 2)}\n`)
console.log(`Imported ${armor.length} armor pieces from ${setPages.length} set page(s) and ${decorations.length} decorations.`)