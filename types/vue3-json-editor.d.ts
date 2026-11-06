// Tipos públicos do pacote — escritos à mão de propósito.
//
// Gerá-los com o tsc a partir dos tipos do Vue usado no build (3.5) produz um DefineComponent
// com mais parâmetros genéricos do que o Vue 3.2 aceita e um import de `vue/jsx-runtime`
// (só existe a partir do Vue 3.3), quebrando quem usa TypeScript com Vue 3.2/3.3.
// A forma abaixo (DefineComponent com um único parâmetro: as opções de props) funciona em
// todas as versões suportadas (peerDependency `vue`).
//
// Ao adicionar/alterar uma prop em components/vue3-json-editor.tsx, atualize aqui também.
// A bateria de contrato (contract-tests/tests/types.spec.mjs) acusa divergência.
import type { DefineComponent } from 'vue'

export declare const Vue3JsonEditor: DefineComponent<{
  modelValue: (StringConstructor | BooleanConstructor | ObjectConstructor | ArrayConstructor)[]
  showBtns: BooleanConstructor[]
  expandedOnStart: {
    type: BooleanConstructor
    default: boolean
  }
  mode: {
    type: StringConstructor
    default: string
  }
  modes: {
    type: ArrayConstructor
    default: () => string[]
  }
  lang: {
    type: StringConstructor
    default: string
  }
  options: {
    type: ObjectConstructor
    default: () => Record<string, unknown>
  }
}>
