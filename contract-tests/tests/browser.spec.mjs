// Contrato no browser real. Referência: 1.1.5 publicada.
//
// Convenção:
//   test(...)        -> comportamento atual que NÃO pode mudar (contrato).
//   test.fail(...)   -> bug conhecido ainda sem correção (issue no título). Falha de propósito;
//                       quando a correção entrar, o Playwright acusa "expected to fail" -> trocar
//                       por test(...) + fixedIn('<versão da correção>').
//   fixedIn(v)       -> bug corrigido/recurso adicionado na versão v: falha esperada antes (ex.: 1.1.5)
//                       (1.1.6 = "depois da 1.1.5": é a versão do package.json até o próximo release)
//                       e contrato obrigatório de v em diante.
import { test, expect } from '@playwright/test'
import { createRequire } from 'node:module'
import { KNOWN, cmp, fixedIn, pkgVersion, openEditor, events, model, typeInTextMode, switchMode, menuModes } from './helpers.mjs'

const pkg = createRequire(import.meta.url)('vue3-json-editor/package.json')
const DEFAULT_MODEL = { hello: 'world', n: 1, nested: { a: [1, 2, 3] } }
// eventos que carregam dados/estado; provide-editor/mode-change são informativos e podem ser adicionados
const dataEvents = async (page) => (await events(page)).filter((e) => !['provide-editor', 'mode-change'].includes(e.name))

test.describe(`vue3-json-editor@${pkg.version} no browser`, () => {
  test.describe('renderização e props', () => {
    test('renderiza no modo tree por padrão, com o valor inicial e sem erros/warnings', async ({ page }) => {
      const { problems } = await openEditor(page)
      await expect(page.locator('.jsoneditor-vue > .jsoneditor')).toHaveClass(/jsoneditor-mode-tree/)
      await expect(page.locator('.jsoneditor-vue')).toHaveAttribute('id', /^jsoneditor-vue-\d+$/)
      const text = await page.locator('.jsoneditor-outer').innerText()
      for (const s of ['hello', 'world', 'nested']) expect(text).toContain(s)
      expect(await dataEvents(page)).toEqual([]) // montar não emite eventos de dados
      expect(problems()).toEqual([])
    })

    test('showBtns: botão SAVE oculto por padrão (contrato real; README diz o contrário)', async ({ page }) => {
      await openEditor(page)
      await expect(page.locator('.json-save-btn')).toHaveCount(0)
    })

    test('showBtns: true mostra o botão; false esconde', async ({ page }) => {
      await openEditor(page, { props: { showBtns: true } })
      await expect(page.locator('.jsoneditor-btns > button.json-save-btn')).toHaveText('SAVE')
      await openEditor(page, { props: { showBtns: false } })
      await expect(page.locator('.json-save-btn')).toHaveCount(0)
    })

    for (const [lang, label] of [['en', 'SAVE'], ['it', 'SALVA'], ['zh', '保存']]) {
      test(`lang="${lang}" -> rótulo "${label}"`, async ({ page }) => {
        await openEditor(page, { props: { showBtns: true, lang } })
        await expect(page.locator('.json-save-btn')).toHaveText(label)
      })
    }

    for (const mode of ['tree', 'code', 'form', 'text', 'view']) {
      test(`mode="${mode}" abre no modo pedido`, async ({ page }) => {
        const { problems } = await openEditor(page, { props: { mode } })
        await expect(page.locator('.jsoneditor-vue > .jsoneditor')).toHaveClass(new RegExp(`jsoneditor-mode-${mode}`))
        expect(problems(KNOWN.aceWorker)).toEqual([])
      })
    }

    test('modes: menu padrão tem Tree, Code, Form, Text, View', async ({ page }) => {
      await openEditor(page)
      expect(await menuModes(page)).toEqual(['Tree', 'Code', 'Form', 'Text', 'View'])
    })

    test('modes: lista customizada restringe o menu', async ({ page }) => {
      await openEditor(page, { props: { modes: ['tree', 'text'] } })
      expect(await menuModes(page)).toEqual(['Tree', 'Text'])
    })

    test('expandedOnStart: false (padrão) deixa nós aninhados recolhidos', async ({ page }) => {
      await openEditor(page)
      expect(await page.locator('.jsoneditor-collapsed').count()).toBeGreaterThan(0)
    })

    test('expandedOnStart: true expande tudo, sem erro', async ({ page }) => {
      const { problems } = await openEditor(page, { props: { expandedOnStart: true } })
      await expect(page.locator('.jsoneditor-collapsed')).toHaveCount(0)
      expect(problems()).toEqual([])
    })
  })

  test.describe('layout padrão', () => {
    // As barras extras do jsoneditor 10 mudam a altura do editor; por padrão ficam desligadas
    // para não deslocar o layout de quem atualiza. Opt-in via prop `options`.
    for (const mode of ['tree', 'code', 'text']) {
      test(`mode="${mode}": sem barra de navegação nem barra de status por padrão`, async ({ page }) => {
        await openEditor(page, { props: { mode } })
        await expect(page.locator('.jsoneditor-navigation-bar')).toHaveCount(0)
        await expect(page.locator('.jsoneditor-statusbar')).toHaveCount(0)
      })
    }
  })

  test.describe('prop options (repasse ao jsoneditor)', () => {
    test('options liga recursos do jsoneditor (navigationBar, statusBar)', async ({ page }) => {
      fixedIn('1.1.6')
      await openEditor(page, { props: { options: { navigationBar: true } } })
      await expect(page.locator('.jsoneditor-navigation-bar')).toHaveCount(1)
      await openEditor(page, { props: { mode: 'text', options: { statusBar: true } } })
      await expect(page.locator('.jsoneditor-statusbar')).toHaveCount(1)
    })

    test('options não substitui os callbacks do componente: json-change continua sendo emitido', async ({ page }) => {
      fixedIn('1.1.6')
      await openEditor(page, { props: { mode: 'text', options: { onChange: 'record' } } })
      await typeInTextMode(page, '{"x": 1}')
      await expect.poll(() => events(page, 'json-change')).toEqual([{ i: 0, name: 'json-change', payload: { x: 1 } }])
      expect(await page.evaluate(() => window.__harness.userOnChangeCalls)).toBeGreaterThan(0)
    })

    test('props mode/modes têm precedência sobre options.mode/options.modes', async ({ page }) => {
      await openEditor(page, { props: { mode: 'text', modes: ['text', 'tree'], options: { mode: 'code', modes: ['code'] } } })
      await expect(page.locator('.jsoneditor-vue > .jsoneditor')).toHaveClass(/jsoneditor-mode-text/)
      expect(await menuModes(page)).toEqual(['Text', 'Tree'])
    })
  })

  test.describe('eventos', () => {
    test('edição válida emite json-change e input com o JSON novo', async ({ page }) => {
      await openEditor(page, { props: { mode: 'text' } })
      await typeInTextMode(page, '{"x": 42}')
      await expect.poll(() => events(page, 'json-change')).toEqual([{ i: 0, name: 'json-change', payload: { x: 42 } }])
      expect((await events(page, 'input')).filter((e) => !e.payload?.domEvent))
        .toEqual([{ i: 0, name: 'input', payload: { x: 42 } }])
    })

    test('JSON inválido emite has-error (Error do parser) e desabilita o SAVE; ao corrigir, reabilita', async ({ page }) => {
      await openEditor(page, { props: { mode: 'text', showBtns: true } })
      await typeInTextMode(page, '{"x": ')
      await expect.poll(async () => (await events(page, 'has-error')).length).toBeGreaterThan(0)
      const [err] = await events(page, 'has-error')
      expect(err.payload.error).toMatch(/Parse error/)
      await expect(page.locator('.json-save-btn')).toBeDisabled()
      await typeInTextMode(page, '{"x": 1}')
      await expect(page.locator('.json-save-btn')).toBeEnabled()
    })

    test('SAVE emite json-save com o JSON atual', async ({ page }) => {
      await openEditor(page, { props: { mode: 'text', showBtns: true } })
      await typeInTextMode(page, '{"y": 1}')
      await expect.poll(() => events(page, 'json-change')).toHaveLength(1)
      await page.locator('.json-save-btn').click()
      expect(await events(page, 'json-save')).toEqual([{ i: 0, name: 'json-save', payload: { y: 1 } }])
    })

    test('SAVE sem edição emite json-save com o valor inicial', async ({ page }) => {
      await openEditor(page, { props: { showBtns: true } })
      await page.locator('.json-save-btn').click()
      expect(await events(page, 'json-save')).toEqual([{ i: 0, name: 'json-save', payload: DEFAULT_MODEL }])
    })

    test('mudança externa do modelValue atualiza o editor, sem emitir eventos de dados', async ({ page }) => {
      await openEditor(page, { props: { mode: 'text' } })
      await page.evaluate(() => window.__harness.setModel(0, { trocado: true }))
      await expect.poll(() => page.locator('textarea.jsoneditor-text').inputValue()).toContain('trocado')
      expect(await dataEvents(page)).toEqual([])
    })

    test('#24 v-model é two-way: editar atualiza o valor do pai (update:modelValue)', async ({ page }) => {
      fixedIn('1.1.6')
      await openEditor(page, { props: { mode: 'text' } })
      await typeInTextMode(page, '{"x": 42}')
      await expect.poll(() => model(page), { timeout: 2000 }).toEqual({ x: 42 })
      expect(await events(page, 'update:modelValue')).toEqual([{ i: 0, name: 'update:modelValue', payload: { x: 42 } }])
    })

    test('#24 ordem dos eventos numa edição: json-change, input, update:modelValue', async ({ page }) => {
      fixedIn('1.1.6')
      await openEditor(page, { props: { mode: 'text' } })
      await typeInTextMode(page, '{"x": 42}')
      await expect.poll(() => events(page, 'update:modelValue')).toHaveLength(1)
      const names = (await dataEvents(page)).filter((e) => !e.payload?.domEvent).map((e) => e.name)
      expect(names).toEqual(['json-change', 'input', 'update:modelValue'])
    })

    test('#24 o valor que volta pelo v-model não é reaplicado no editor (sem reformatar/resetar o texto)', async ({ page }) => {
      await openEditor(page, { props: { mode: 'text' } })
      // digitação tecla a tecla, como um usuário: se o v-model reaplicasse o valor no editor,
      // o jsoneditor reformataria o texto e o cursor pularia no meio da digitação
      const ta = page.locator('textarea.jsoneditor-text')
      await ta.fill('')
      await ta.pressSequentially('{"a": 1, "b": [1, 2]}', { delay: 15 })
      await page.waitForTimeout(300)
      expect(await ta.inputValue()).toBe('{"a": 1, "b": [1, 2]}')
      if (cmp(pkgVersion, '1.1.6') >= 0) await expect.poll(() => model(page)).toEqual({ a: 1, b: [1, 2] })
    })

    test('#24 modo tree: editar um valor atualiza o pai e não fecha os nós expandidos', async ({ page }) => {
      await openEditor(page, { props: { expandedOnStart: true } })
      const expandedBefore = await page.locator('.jsoneditor-expanded').count()
      const value = page.locator('.jsoneditor-tree div.jsoneditor-value', { hasText: 'world' })
      await value.click()
      await page.keyboard.press('ControlOrMeta+A')
      await page.keyboard.type('mundo')
      await page.keyboard.press('Tab') // sai do campo -> jsoneditor confirma a edição
      await expect.poll(() => events(page, 'json-change')).toHaveLength(1)
      expect((await events(page, 'json-change'))[0].payload).toEqual({ hello: 'mundo', n: 1, nested: { a: [1, 2, 3] } })
      await page.waitForTimeout(200)
      expect(await page.locator('.jsoneditor-expanded').count()).toBe(expandedBefore)
      if (cmp(pkgVersion, '1.1.6') >= 0) await expect.poll(() => model(page)).toEqual({ hello: 'mundo', n: 1, nested: { a: [1, 2, 3] } })
    })

    test('#24 depois de editar, o pai ainda consegue trocar o valor por fora', async ({ page }) => {
      await openEditor(page, { props: { mode: 'text' } })
      await typeInTextMode(page, '{"x": 1}')
      await expect.poll(() => events(page, 'json-change')).toHaveLength(1)
      await page.waitForTimeout(100)
      await page.evaluate(() => window.__harness.setModel(0, { trocado: 2 }))
      await expect.poll(async () => JSON.parse(await page.locator('textarea.jsoneditor-text').inputValue())).toEqual({ trocado: 2 })
    })

    test.fail('@input recebe só o JSON, nunca eventos nativos do DOM (falta declarar emits)', async ({ page }) => {
      await openEditor(page, { props: { mode: 'text' } })
      await typeInTextMode(page, '{"x": 42}')
      await expect.poll(() => events(page, 'json-change')).toHaveLength(1)
      expect((await events(page, 'input')).filter((e) => e.payload?.domEvent)).toEqual([])
    })

    test('#30 provide-editor entrega a instância do editor após montar', async ({ page }) => {
      fixedIn('1.1.6')
      await openEditor(page)
      await expect.poll(() => events(page, 'provide-editor'), { timeout: 2000 })
        .toEqual([{ i: 0, name: 'provide-editor', payload: { editor: true, hasGet: true } }])
    })

    test('mode-change é emitido ao trocar de modo (PR #27)', async ({ page }) => {
      fixedIn('1.1.6')
      await openEditor(page)
      await switchMode(page, 'Text')
      await expect.poll(() => events(page, 'mode-change'), { timeout: 2000 })
        .toEqual([{ i: 0, name: 'mode-change', payload: 'text' }])
    })
  })

  test.describe('troca de modo', () => {
    test('trocar de modo pelo menu preserva o conteúdo e não emite json-change', async ({ page }) => {
      await openEditor(page)
      await switchMode(page, 'Text')
      await expect(page.locator('.jsoneditor-vue > .jsoneditor')).toHaveClass(/jsoneditor-mode-text/)
      expect(JSON.parse(await page.locator('textarea.jsoneditor-text').inputValue())).toEqual(DEFAULT_MODEL)
      expect(await events(page, 'json-change')).toEqual([])
    })
  })

  test.describe('modo code (Ace)', () => {
    test('#18 #23 #28 abrir o modo code não gera "Could not load worker"', async ({ page }) => {
      fixedIn('1.1.6')
      const { problems } = await openEditor(page, { props: { mode: 'code' } })
      await page.waitForTimeout(500)
      expect(problems()).toEqual([])
    })

    test('#31 modo code sinaliza erro de sintaxe no editor', async ({ page }) => {
      fixedIn('1.1.6')
      await openEditor(page, { props: { mode: 'code' } })
      await page.locator('.ace_text-input').focus()
      await page.keyboard.press('Control+End')
      await page.keyboard.type(' xx')
      await expect(page.locator('.ace_gutter-cell.ace_error')).not.toHaveCount(0, { timeout: 3000 })
    })
  })

  test.describe('vários editores', () => {
    test('#14 cada editor tem seu próprio container e estado', async ({ page }) => {
      const { problems } = await openEditor(page, { props: { mode: 'text' }, count: 2 })
      const ids = await page.locator('.jsoneditor-vue').evaluateAll((els) => els.map((e) => e.id))
      expect(new Set(ids).size).toBe(2)
      for (const el of await page.locator('.jsoneditor-vue').all()) {
        await expect(el.locator(':scope > .jsoneditor')).toHaveCount(1)
      }
      await typeInTextMode(page, '{"segundo": true}', 1)
      await expect.poll(() => events(page, 'json-change')).toEqual([{ i: 1, name: 'json-change', payload: { segundo: true } }])
      expect(JSON.parse(await page.locator('textarea.jsoneditor-text').nth(0).inputValue())).toEqual(DEFAULT_MODEL)
      expect(problems()).toEqual([])
    })
  })

  test.describe('UMD via <script> (unpkg, sem bundler)', () => {
    for (const file of ['vue3-json-editor.umd.prod.js', 'vue3-json-editor.umd.js']) {
      test(`${file}: expõe window["vue3-json-editor"].Vue3JsonEditor e renderiza sem erros`, async ({ page }) => {
        const problems = []
        page.on('console', (m) => { if (['warning', 'error'].includes(m.type())) problems.push(m.text()) })
        page.on('pageerror', (e) => problems.push(e.message))
        await page.goto(`/umd.html?file=${file}`)
        await page.waitForFunction(() => window.__umd?.ready)
        expect(await page.evaluate(() => window.__umd.globalKeys)).toContain('Vue3JsonEditor')
        await expect(page.locator('.jsoneditor-vue > .jsoneditor')).toHaveClass(/jsoneditor-mode-tree/)
        await expect(page.locator('.json-save-btn')).toHaveText('SAVE')
        expect(await page.locator('.jsoneditor-outer').innerText()).toContain('umd')
        expect(problems).toEqual([])
      })
    }
  })

  test.describe('CSS', () => {
    test('estilos e ícones chegam sem o usuário importar CSS', async ({ page }) => {
      await openEditor(page, { props: { showBtns: true } })
      const styles = await page.evaluate(() => {
        const btn = getComputedStyle(document.querySelector('.json-save-btn'))
        const menuBtn = getComputedStyle(document.querySelector('.jsoneditor-menu > button'))
        return { btnBg: btn.backgroundColor, menuIcon: menuBtn.backgroundImage }
      })
      expect(styles.btnBg).toBe('rgb(32, 160, 255)') // .json-save-btn do style.css do pacote
      expect(styles.menuIcon).toMatch(/^url\("data:image\/svg\+xml/) // ícones inline, sem request extra
    })
  })

  test.describe('ciclo de vida', () => {
    test('desmontar não gera erros', async ({ page }) => {
      const { problems } = await openEditor(page)
      await page.evaluate(() => window.__harness.unmount())
      await expect(page.locator('.jsoneditor-vue')).toHaveCount(0)
      expect(problems()).toEqual([])
    })
  })
})
