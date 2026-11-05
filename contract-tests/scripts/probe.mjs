// Sondagem exploratória: abre o fixture e imprime console, erros e um resumo do DOM.
//   node scripts/probe.mjs '<query string>'
import { chromium } from '@playwright/test'

const qs = process.argv[2] || ''
const browser = await chromium.launch()
const page = await browser.newPage()
page.on('console', (m) => console.log(`[console.${m.type()}]`, m.text().slice(0, 300)))
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
await page.goto(`http://localhost:5199/${qs}`)
await page.waitForFunction(() => window.__harness?.ready)
await page.waitForTimeout(1500)
const summary = await page.evaluate(() => {
  const root = document.querySelector('#editors')
  const classes = new Set()
  root.querySelectorAll('[class]').forEach((el) => el.classList.forEach((c) => classes.add(c)))
  return {
    html: root.innerHTML.slice(0, 1500),
    classes: [...classes].sort(),
    events: window.__harness.events,
    model: window.__harness.getModel(0)
  }
})
console.log(JSON.stringify(summary, null, 2))
await browser.close()
