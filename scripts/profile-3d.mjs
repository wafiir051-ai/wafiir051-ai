// Membuat grafik kontribusi 3D (balok isometrik, hijau) sebagai satu file SVG.
// Data diambil dari halaman kontribusi publik GitHub, tanpa token dan tanpa paket pihak ketiga.
// Pakai: node scripts/profile-3d.mjs [username]
import { mkdir, writeFile } from 'node:fs/promises'

const USER = process.argv[2] || process.env.USERNAME || 'wafiir051-ai'
const OUT = 'profile-3d-contrib/profile-3d.svg'

const res = await fetch(`https://github.com/users/${USER}/contributions`, {
  headers: { 'x-requested-with': 'XMLHttpRequest' },
})
if (!res.ok) throw new Error(`Gagal mengambil data kontribusi: ${res.status}`)
const html = await res.text()

// Tiap hari: <td data-date data-level id="contribution-day-component-{baris}-{kolom}">,
// jumlahnya ada di <tool-tip for="...">3 contributions on ...</tool-tip>.
const counts = new Map()
for (const m of html.matchAll(/<tool-tip[^>]*\bfor="(contribution-day-component-\d+-\d+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
  const n = m[2].match(/^(\d+)\s+contribution/)
  counts.set(m[1], n ? Number(n[1]) : 0)
}
const days = []
for (const m of html.matchAll(/<td\b[^>]*>/g)) {
  const tag = m[0]
  const id = tag.match(/id="contribution-day-component-(\d+)-(\d+)"/)
  const date = tag.match(/data-date="([\d-]+)"/)
  const level = tag.match(/data-level="(\d)"/)
  if (!id || !date || !level) continue
  days.push({
    row: Number(id[1]),
    col: Number(id[2]),
    date: date[1],
    level: Number(level[1]),
    count: counts.get(`contribution-day-component-${id[1]}-${id[2]}`) ?? 0,
  })
}
if (days.length < 300) throw new Error(`Data tidak lengkap (${days.length} hari)`)

// Baris di halaman GitHub = hari dalam minggu (0 = Minggu); kolom = minggu. Urutkan menurut tanggal
// supaya kolom benar-benar berurutan.
days.sort((a, b) => (a.date < b.date ? -1 : 1))
const first = new Date(days[0].date + 'T00:00:00Z')
const cells = days.map((d) => {
  const t = new Date(d.date + 'T00:00:00Z')
  const offset = Math.round((t - first) / 86400000) + first.getUTCDay()
  return { ...d, w: Math.floor(offset / 7), d: t.getUTCDay() }
})
const weeks = Math.max(...cells.map((c) => c.w)) + 1
const total = cells.reduce((s, c) => s + c.count, 0)
const maxCount = Math.max(1, ...cells.map((c) => c.count))

// Proyeksi: minggu (w) mengarah ke kanan-bawah dengan landai, hari (d) ke kiri-bawah, tinggi ke atas.
const WX = 10.4
const WY = 3.2
const DX = -6.6
const DY = 5.6
const MAXH = 84
const proj = (w, d, z = 0) => [w * WX + d * DX, w * WY + d * DY - z]

const PALETTE = ['#12281f', '#1c6b53', '#23a07c', '#2fc794', '#3ed8a8']
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16)
  const f = (v) => Math.round(v * k).toString(16).padStart(2, '0')
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`
}
const pt = (p) => p.map((v) => v.toFixed(1)).join(',')

// Gambar dari yang terjauh (y dasar terkecil) ke yang terdekat.
const order = [...cells].sort((a, b) => a.w * WY + a.d * DY - (b.w * WY + b.d * DY) || a.w - b.w)
const shapes = []
let minX = Infinity
let maxX = -Infinity
let minY = Infinity
let maxY = -Infinity
for (const c of order) {
  const z = c.count === 0 ? 1.5 : 5 + Math.sqrt(c.count / maxCount) * MAXH
  const base = PALETTE[c.level]
  const A = proj(c.w, c.d, z)
  const B = proj(c.w + 1, c.d, z)
  const C = proj(c.w + 1, c.d + 1, z)
  const D = proj(c.w, c.d + 1, z)
  const B0 = proj(c.w + 1, c.d, 0)
  const C0 = proj(c.w + 1, c.d + 1, 0)
  const D0 = proj(c.w, c.d + 1, 0)
  for (const p of [A, B, C, D, B0, C0, D0]) {
    minX = Math.min(minX, p[0])
    maxX = Math.max(maxX, p[0])
    minY = Math.min(minY, p[1])
    maxY = Math.max(maxY, p[1])
  }
  shapes.push(
    `<path d="M${pt(D)} L${pt(C)} L${pt(C0)} L${pt(D0)}Z" fill="${shade(base, 0.62)}"/>` +
      `<path d="M${pt(B)} L${pt(C)} L${pt(C0)} L${pt(B0)}Z" fill="${shade(base, 0.42)}"/>` +
      `<path d="M${pt(A)} L${pt(B)} L${pt(C)} L${pt(D)}Z" fill="${base}"/>`,
  )
}

const pad = 28
const footer = 34
const W = Math.ceil(maxX - minX + pad * 2)
const H = Math.ceil(maxY - minY + pad * 2 + footer)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik kontribusi 3D ${USER}: ${total} kontribusi dalam setahun terakhir">
<rect width="${W}" height="${H}" rx="12" fill="#081410"/>
<g transform="translate(${(pad - minX).toFixed(1)} ${(pad - minY).toFixed(1)})" stroke="#081410" stroke-width="0.4" stroke-linejoin="round">
${shapes.join('\n')}
</g>
<text x="${pad}" y="${H - 16}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="12" fill="#9fb5ab" letter-spacing="0.5">${total} kontribusi dalam setahun terakhir</text>
</svg>
`
await mkdir('profile-3d-contrib', { recursive: true })
await writeFile(OUT, svg)
console.log(`${OUT}: ${W}x${H}, ${cells.length} hari, ${total} kontribusi, puncak ${maxCount}/hari`)
