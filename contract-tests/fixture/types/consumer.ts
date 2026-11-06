// Código TypeScript de um "usuário" do pacote. O teste de tipos compila este arquivo com tsc.
import { defineComponent, h } from 'vue'
import { Vue3JsonEditor } from 'vue3-json-editor'

// registrar como componente
export const Page = defineComponent({
  components: { Vue3JsonEditor },
  render: () => h(Vue3JsonEditor, {
    modelValue: { a: 1 },
    showBtns: true,
    expandedOnStart: false,
    mode: 'code',
    modes: ['tree', 'code'],
    lang: 'zh'
  })
})

// modelValue aceita String | Boolean | Object | Array
h(Vue3JsonEditor, { modelValue: 'texto' })
h(Vue3JsonEditor, { modelValue: true })
h(Vue3JsonEditor, { modelValue: [1, 2, 3] })

// os tipos não podem ser `any`: prop com tipo errado tem que dar erro
// @ts-expect-error mode é string
h(Vue3JsonEditor, { mode: 123 })

// prop `options` (repasse ao jsoneditor) — a partir da 1.2.0
export const withOptions = () => h(Vue3JsonEditor, { options: { navigationBar: true } })

// prop `height` (#32): número (px) ou string CSS — a partir da 1.2.0
export const withHeight = () => [h(Vue3JsonEditor, { height: 400 }), h(Vue3JsonEditor, { height: '60vh' })]
