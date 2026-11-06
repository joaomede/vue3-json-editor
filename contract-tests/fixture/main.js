// App "de usuário" controlado pelos testes.
// Importa o pacote exatamente como a README manda: `import { Vue3JsonEditor } from 'vue3-json-editor'`.
//
// Parâmetros de URL:
//   ?props=<JSON>    props passadas ao componente (ex.: {"mode":"code","showBtns":true})
//   ?model=<JSON>    valor inicial do v-model (default: {"hello":"world","n":1,"nested":{"a":[1,2,3]}})
//   ?count=<n>       quantos editores renderizar (default 1)
//
// API exposta em window.__harness para os testes:
//   events            lista de { i, name, payload } emitidos por cada editor
//   getModel(i)       valor atual do v-model do editor i (no lado do "usuário")
//   setModel(i, v)    altera o v-model do editor i por fora (parent -> editor)
//   editors           instâncias recebidas via provide-editor
//   unmount()         desmonta o app
import { createApp, h, reactive, toRaw } from 'vue'
import { Vue3JsonEditor } from 'vue3-json-editor'

const params = new URLSearchParams(location.search)
const props = params.has('props') ? JSON.parse(params.get('props')) : {}
// JSON não carrega funções: `options.onChange: "record"` vira um callback do "usuário" que só conta chamadas
if (props.options?.onChange === 'record') {
  props.options.onChange = () => { window.__harness.userOnChangeCalls++ }
}
// Listener extra passado ao componente (ex.: `"onClick": "record"`), fora dos eventos do componente:
// registra { name: 'attr:<key>', payload } em events — para testar o repasse (fallthrough) à raiz.
for (const [key, value] of Object.entries(props)) {
  if (/^on[A-Z]/.test(key) && value === 'record') {
    props[key] = (payload) => events.push({ i: 0, name: `attr:${key}`, payload: serialize(key, payload) })
  }
}
const initialModel = params.has('model')
  ? JSON.parse(params.get('model'))
  : { hello: 'world', n: 1, nested: { a: [1, 2, 3] } }
const count = Number(params.get('count') || 1)

const EVENTS = ['json-change', 'input', 'update:modelValue', 'json-save', 'has-error', 'mode-change', 'provide-editor']

const models = reactive(Array.from({ length: count }, () => structuredClone(initialModel)))
const events = []
const editors = []

function serialize (name, payload) {
  if (name === 'provide-editor') return { editor: true, hasGet: typeof payload?.get === 'function' }
  if (payload instanceof Event) return { domEvent: payload.type }
  if (payload instanceof Error) return { error: payload.message }
  try { return structuredClone(toRaw(payload)) } catch { return String(payload) }
}

function listeners (i) {
  const out = {}
  for (const name of EVENTS) {
    // mesma forma que o compilador de template gera para @json-change, @update:modelValue etc.
    const camel = name.replace(/-(\w)/g, (_, c) => c.toUpperCase())
    const key = 'on' + camel[0].toUpperCase() + camel.slice(1)
    out[key] = (payload) => {
      events.push({ i, name, payload: serialize(name, payload) })
      if (name === 'update:modelValue') models[i] = payload
      if (name === 'provide-editor') editors[i] = payload
    }
  }
  return out
}

const app = createApp({
  render: () => h('div', { id: 'editors' }, models.map((_, i) =>
    h('section', { class: 'editor-slot', 'data-i': i }, [
      h(Vue3JsonEditor, { ...props, modelValue: models[i], ...listeners(i) })
    ])
  ))
})

window.__harness = {
  events,
  editors,
  userOnChangeCalls: 0,
  getModel: (i = 0) => structuredClone(toRaw(models[i])),
  setModel: (i, v) => { models[i] = v },
  unmount: () => app.unmount()
}

app.mount('#app')
window.__harness.ready = true
