import { expect, test } from '@playwright/test'
import { createRequire } from 'node:module'

export const pkgVersion = createRequire(import.meta.url)('vue3-json-editor/package.json').version

export const cmp = (a, b) => {
  const [pa, pb] = [a, b].map((v) => v.split(/[.-]/).slice(0, 3).map(Number))
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i]
  return 0
}

// Build local (npm run test:contract): ainda carrega a versão do último release no package.json,
// mas contém as correções da próxima versão.
const localBuild = process.env.V3JE_LOCAL_BUILD === '1'

/**
 * Bug corrigido na versão `version`: em versões publicadas anteriores o teste é falha esperada;
 * de `version` em diante (e no build local) é contrato obrigatório. Chamar no início do teste.
 */
export function fixedIn (version) {
  test.fail(!localBuild && cmp(pkgVersion, version) < 0, `bug presente antes da ${version}`)
}

// Warnings que sabemos que vêm do pacote e estão associados a issues abertas.
// Um teste só os tolera se pedir explicitamente; qualquer outro warning/erro de console é falha.
export const KNOWN = {
  // #18 #23 #28 #31 — Ace não cria o worker porque o bundle strict transforma `this` global em undefined
  aceWorker: /Could not load worker/
}

// Ruído do próprio Vite/ambiente, não do pacote.
const NOISE = [/^\[vite\]/, /Download the Vue Devtools/]

/**
 * Abre o fixture com props/model/count e começa a coletar console e erros de página.
 * Retorna { page, problems() }.
 */
export async function openEditor (page, { props, model, count } = {}) {
  const logs = []
  page.on('console', (m) => {
    if (m.type() !== 'warning' && m.type() !== 'error') return
    const text = m.text()
    if (NOISE.some((re) => re.test(text))) return
    logs.push({ type: m.type(), text })
  })
  page.on('pageerror', (e) => logs.push({ type: 'pageerror', text: e.message }))

  const qs = new URLSearchParams()
  if (props) qs.set('props', JSON.stringify(props))
  if (model !== undefined) qs.set('model', JSON.stringify(model))
  if (count) qs.set('count', String(count))
  await page.goto('/?' + qs.toString())
  await page.waitForFunction(() => window.__harness?.ready)
  await expect(page.locator('.jsoneditor-vue .jsoneditor').first()).toBeVisible()

  return {
    page,
    /** Problemas de console, exceto os explicitamente tolerados. */
    problems: (...allowed) => logs.filter((l) => !allowed.some((re) => re.test(l.text))),
    logs
  }
}

export const events = (page, name) =>
  page.evaluate((n) => window.__harness.events.filter((e) => !n || e.name === n), name)

export const model = (page, i = 0) => page.evaluate((idx) => window.__harness.getModel(idx), i)

/** Substitui o conteúdo do editor no modo text. */
export async function typeInTextMode (page, text, i = 0) {
  await page.locator('.jsoneditor-vue').nth(i).locator('textarea.jsoneditor-text').fill(text)
}

/** Abre o menu de modos e escolhe um (rótulo visível: Tree, Code, Form, Text, View). */
export async function switchMode (page, label, i = 0) {
  await page.locator('.jsoneditor-vue').nth(i).locator('button.jsoneditor-modes').click()
  await page.locator('.jsoneditor-contextmenu').getByRole('button', { name: label, exact: true }).click()
}

export async function menuModes (page, i = 0) {
  await page.locator('.jsoneditor-vue').nth(i).locator('button.jsoneditor-modes').click()
  const items = await page.locator('.jsoneditor-contextmenu button.jsoneditor-type-modes').allInnerTexts()
  await page.keyboard.press('Escape')
  return items.map((s) => s.trim()).filter(Boolean)
}

/**
 * Digita via IME (composição), como um teclado chinês/japonês: mostra cada etapa da composição
 * (ex.: 'n', 'ni', 'ni hao') e confirma com o texto final (ex.: '你好'). Usa o protocolo do
 * Chromium (Input.imeSetComposition), que gera compositionstart/update/end reais no elemento focado.
 */
export async function typeWithIme (page, steps, text) {
  const cdp = await page.context().newCDPSession(page)
  for (const t of steps) {
    await cdp.send('Input.imeSetComposition', { text: t, selectionStart: t.length, selectionEnd: t.length })
  }
  await cdp.send('Input.insertText', { text })
  await cdp.detach()
}
