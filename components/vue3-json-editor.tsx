import { ComponentPublicInstance, defineComponent, getCurrentInstance, markRaw, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import jsonEditorCss from 'jsoneditor/dist/jsoneditor.min.css?inline'
import componentCss from './style.css?inline'
import { injectStyle } from './inject-style'

// Os estilos entram no documento quando o pacote é importado (o usuário não importa CSS).
injectStyle(jsonEditorCss)
injectStyle(componentCss)

// O jsoneditor só funciona no browser: ao ser carregado ele acessa `self`/`window`, o que
// quebraria o import do pacote em Node (SSR, test runners). Por isso ele é carregado sob
// demanda no onMounted, que nunca roda no servidor.
function loadJsonEditor (): Promise<any> {
  return import('jsoneditor').then((m: any) => m.default ?? m)
}

export const Vue3JsonEditor = defineComponent({
  props: {
    modelValue: [String, Boolean, Object, Array],
    showBtns: [Boolean],
    expandedOnStart: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String,
      default: 'tree'
    },
    modes: {
      type: Array,
      default: function () {
        return ['tree', 'code', 'form', 'text', 'view']
      }
    },
    lang: {
      type: String,
      default: 'en'
    },
    // Opções repassadas ao jsoneditor na criação do editor (não reativas), por cima dos defaults
    // do componente. Ex.: { navigationBar: true, statusBar: true, search: false }.
    // `mode`/`modes` vêm das props de mesmo nome; onChange/onModeChange do usuário são chamados
    // depois dos do componente.
    options: {
      type: Object,
      default: () => ({})
    },
    // Altura da área do editor (sem o botão SAVE), igual em todos os modos (#32).
    // Número = px (ex.: 400); string = qualquer valor CSS (ex.: '60vh', '400px').
    // Sem height, valem as alturas mínimas do style.css, como antes.
    height: [String, Number]
  },
  // Declarar os eventos impede que os listeners deles caiam na <div> raiz como listeners nativos
  // (sem isso, @input recebia também os InputEvent do DOM de cada tecla digitada no editor).
  // Listeners/atributos não declarados (@click, class, style...) continuam indo para a raiz.
  emits: ['json-change', 'input', 'update:modelValue', 'json-save', 'has-error', 'mode-change', 'provide-editor'],
  setup (props: any, { emit }) {
    const root = getCurrentInstance()?.root.proxy as ComponentPublicInstance
    const container = ref<HTMLElement | null>(null)
    let unmounted = false

    const state = reactive({
      editor: null as any,
      error: false,
      json: {},
      internalChange: false,
      expandedModes: ['tree', 'view', 'form'],
      locale: {
        it: {
          save: 'SALVA'
        },
        en: {
          save: 'SAVE'
        },
        zh: {
          save: '保存'
        }
      },
      uid: `jsoneditor-vue-${getCurrentInstance()?.uid}`
    })

    watch(
      () => props.modelValue as unknown as any,
      async (val) => {
        if (!state.internalChange) {
          state.json = val
          await setEditor(val)
          state.error = false
          expandAll()
        }
      }, { immediate: true })

    onMounted(async () => {
      const JsonEditor = await loadJsonEditor()
      // o componente pode ter sido desmontado enquanto o jsoneditor carregava
      if (unmounted || !container.value) return

      const userOptions = props.options || {}
      const options = {
        // As barras de navegação/status do jsoneditor 10 mudam a altura do editor em relação à
        // 1.1.5 (jsoneditor 5); ficam desligadas por padrão e podem ser ligadas via `options`.
        navigationBar: false,
        statusBar: false,
        ...userOptions,
        mode: props.mode,
        modes: props.modes,
        onChange () {
          handleChange()
          if (typeof userOptions.onChange === 'function') userOptions.onChange()
        },
        onModeChange (newMode: string, oldMode: string) {
          emit('mode-change', newMode)
          state.expandedModes.includes(newMode) && expandAll()
          if (typeof userOptions.onModeChange === 'function') userOptions.onModeChange(newMode, oldMode)
        }
      }
      // markRaw: a instância do jsoneditor não deve virar um Proxy reativo do Vue
      state.editor = markRaw(new JsonEditor(container.value, options, state.json))
      expandAll()

      emit('provide-editor', state.editor)
    })

    function handleChange () {
      try {
        const json = state.editor.get()
        state.json = json
        state.error = false
        emit('json-change', json)
        // internalChange impede que o valor devolvido pelo pai (v-model) seja reaplicado no
        // editor pelo watch de modelValue, o que reformataria o texto e resetaria o cursor
        state.internalChange = true
        emit('input', json) // mantido por compatibilidade com quem escuta @input
        emit('update:modelValue', json) // v-model two-way (#24)
        root.$nextTick(function () {
          state.internalChange = false
        })
      } catch (e) {
        state.error = true
        emit('has-error', e)
      }
    }

    onBeforeUnmount(() => {
      unmounted = true
    })

    function expandAll () {
      if (state.editor && props.expandedOnStart && state.expandedModes.includes(props.mode)) {
        (state.editor as any).expandAll()
      }
    }

    function onSave () {
      emit('json-save', state.json)
    }

    function setEditor (value: any): void {
      if (state.editor) state.editor.set(value)
    }

    function fixedHeight (): string | undefined {
      const h = props.height
      if (h === undefined || h === null || h === '') return undefined
      return typeof h === 'number' ? `${h}px` : String(h)
    }

    return () => {
      return (
        <div>
          <div
            id={state.uid}
            ref={container}
            // a classe extra desliga os min-height do style.css, para alturas menores também funcionarem
            class={fixedHeight() ? 'jsoneditor-vue jsoneditor-vue-fixed-height' : 'jsoneditor-vue'}
            // sem height, nem passa `style` (no SSR do Vue 3.2, style={undefined} vira style="")
            {...(fixedHeight() ? { style: { height: fixedHeight() } } : {})}
          ></div>
          {props.showBtns !== false && (
            <div class={'jsoneditor-btns'}>
              <button
                class={'json-save-btn'}
                type={'button'}
                onClick={() => {
                  onSave()
                }}
                disabled={state.error}
                // lang sem tradução cai no inglês (antes quebrava a renderização)
              >{(state.locale[props.lang] || state.locale.en).save}</button>
            </div>
          )}
        </div>
      )
    }
  }
})
