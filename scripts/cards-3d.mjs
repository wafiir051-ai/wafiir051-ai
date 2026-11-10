// Membuat banner dan kartu proyek bergaya 3D (balok dengan sisi atas dan samping) sebagai SVG statis.
// Pakai: node scripts/cards-3d.mjs
import { mkdir, writeFile } from 'node:fs/promises'

const OUT = 'profile-3d-contrib'
const MINT = '#3ed8a8'
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Banner: huruf ditumpuk bergeser ke kanan-atas supaya tampak timbul.
function banner() {
  const W = 900
  const H = 230
  const depth = 18
  let layers = ''
  for (let i = depth; i >= 1; i--) {
    const k = 0.18 + (0.42 * (depth - i)) / depth
    const c = Math.round(255 * k)
    const col = `rgb(${Math.round(c * 0.2)},${Math.round(c * 0.8)},${Math.round(c * 0.6)})`
    layers += `<text x="${60 + i}" y="${150 - i * 0.55}" fill="${col}">WAFFIR</text>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Waffir Hasan Alkamiil, Full-Stack &amp; IoT Developer">
<rect width="${W}" height="${H}" rx="14" fill="#081410"/>
<g font-family="${SANS}" font-weight="900" font-size="128" letter-spacing="-4">
${layers}
<text x="60" y="150" fill="${MINT}">WAFFIR</text>
<text x="60" y="150" fill="none" stroke="#0b1d16" stroke-width="1.2">WAFFIR</text>
</g>
<text x="64" y="196" font-family="${MONO}" font-size="16" letter-spacing="3" fill="#9fb5ab">FULL-STACK &amp; IOT DEVELOPER · SUBANG, JAWA BARAT</text>
</svg>
`
}

// Kartu: muka depan (teks terbaca), sisi atas, dan sisi kanan memberi kesan balok.
function card(n, title, kind, stack) {
  const W = 440
  const H = 250
  const x = 24
  const y = 44
  const w = 360
  const h = 170
  const d = 26
  const dx = d
  const dy = -d * 0.55
  const tags = stack.split(', ')
  let tx = x + 22
  const tagSvg = tags
    .map((t) => {
      const tw = t.length * 8.2 + 20
      const out = `<g transform="translate(${tx} ${y + h - 46})"><rect width="${tw.toFixed(0)}" height="26" rx="4" fill="#0b1d16" stroke="#2a6b55"/><text x="${(tw / 2).toFixed(0)}" y="17.5" text-anchor="middle" font-family="${MONO}" font-size="12" fill="#9ff0d6">${esc(t)}</text></g>`
      tx += tw + 8
      return out
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}: ${esc(kind)}. ${esc(stack)}">
<rect width="${W}" height="${H}" rx="14" fill="#081410"/>
<ellipse cx="${x + w / 2 + 14}" cy="${y + h + 14}" rx="${w / 2 + 6}" ry="9" fill="#000" opacity=".35"/>
<path d="M${x} ${y} L${x + dx} ${y + dy} L${x + w + dx} ${y + dy} L${x + w} ${y} Z" fill="#2fc794"/>
<path d="M${x + w} ${y} L${x + w + dx} ${y + dy} L${x + w + dx} ${y + h + dy} L${x + w} ${y + h} Z" fill="#0f6b50"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0f2119"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#2a6b55"/>
<rect x="${x}" y="${y}" width="6" height="${h}" fill="${MINT}"/>
<text x="${x + 22}" y="${y + 34}" font-family="${MONO}" font-size="13" letter-spacing="2" fill="${MINT}">${String(n).padStart(2, '0')} / ${esc(kind.toUpperCase())}</text>
<text x="${x + 22}" y="${y + 82}" font-family="${SANS}" font-weight="800" font-size="36" letter-spacing="-1" fill="#eef3ef">${esc(title)}</text>
${tagSvg}
</svg>
`
}

const projects = [
  ['Puspita Indah', 'Website bisnis', 'HTML, CSS, JavaScript'],
  ['EduSpace', 'Platform belajar', 'React, Supabase, Three.js'],
  ['SIMAQ', 'Aplikasi web', 'React, Vite'],
  ['CORVUS', 'E-commerce', 'Next.js, Supabase, Tailwind'],
  ['Wali Santri', 'Aplikasi mobile', 'Flutter, Supabase'],
  ['Portofolio', 'Situs dan admin', 'React, Vite, Supabase'],
]
await mkdir(OUT, { recursive: true })
await writeFile(`${OUT}/banner-3d.svg`, banner())
for (const [i, [t, k, s]] of projects.entries()) {
  await writeFile(`${OUT}/card-${i + 1}.svg`, card(i + 1, t, k, s))
}
console.log(`banner + ${projects.length} kartu ditulis ke ${OUT}/`)
