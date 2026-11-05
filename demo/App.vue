<template>
  <main class="demo">
    <h1>vue3-json-editor demo</h1>

    <div class="controls">
      <label>
        mode
        <select v-model="mode">
          <option v-for="m in modes" :key="m" :value="m">{{ m }}</option>
        </select>
      </label>
      <label>
        lang
        <select v-model="lang">
          <option value="en">en</option>
          <option value="it">it</option>
          <option value="zh">zh</option>
        </select>
      </label>
      <label><input v-model="showBtns" type="checkbox"> show-btns</label>
      <label><input v-model="expandedOnStart" type="checkbox"> expandedOnStart</label>
      <button type="button" @click="resetJson">reset</button>
    </div>

    <!-- :key força recriar o editor quando props de inicialização mudam -->
    <Vue3JsonEditor
      :key="`${mode}-${lang}-${expandedOnStart}`"
      v-model="json"
      :show-btns="showBtns"
      :expanded-on-start="expandedOnStart"
      :mode="mode"
      :lang="lang"
      @json-change="log('json-change', $event)"
      @json-save="log('json-save', $event)"
      @has-error="log('has-error', String($event))"
      @mode-change="log('mode-change', $event)"
      @provide-editor="log('provide-editor', '(editor instance)')"
    />

    <h2>events</h2>
    <ol class="events">
      <li v-for="(e, i) in events" :key="i"><code>{{ e.name }}</code> {{ e.payload }}</li>
    </ol>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Vue3JsonEditor } from '../components'

const initial = () => [
  { name: 'Dirk', age: 1234 },
  { name: 'Jason' }
]

const modes = ['tree', 'code', 'form', 'text', 'view']
const json = ref<unknown>(initial())
const mode = ref('tree')
const lang = ref('en')
const showBtns = ref(true)
const expandedOnStart = ref(false)
const events = ref<{ name: string, payload: string }[]>([])

function log (name: string, payload: unknown) {
  events.value.unshift({ name, payload: typeof payload === 'string' ? payload : JSON.stringify(payload) })
  events.value.length = Math.min(events.value.length, 20)
}

function resetJson () {
  json.value = initial()
}
</script>

<style>
.demo {
  font-family: system-ui, sans-serif;
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
  color: #2c3e50;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}
.events {
  font-size: 0.85rem;
}
</style>
