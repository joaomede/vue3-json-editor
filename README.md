# vue3-json-editor 

(fork vue-json-editor - credits original: [https://github.com/dirkliu/vue-json-editor](https://github.com/dirkliu/vue-json-editor))

A json editor of vue.js

# Support
* Module ESM: Yes
* Unpkg: Yes
* CommonJS: Yes

# Development
```sh
# install
npm install

# run the demo (demo/) against the component source
npm run dev

# build the library into dist/
npm run build

# build, pack and run the contract test suite (contract-tests/) against the packed package
npm run test:contract

# same, once per supported Vue version (3.2, 3.3, 3.5)
npm run test:contract:matrix
```

## Component properties

v-model：bind the [json object]  
:show-btns: boolean, show the save button, default: false (the button is only shown when `show-btns` is set)  
:expandedOnStart: boolean, expand the JSON editor on start for the modes 'tree', 'view', and 'form', default: false  
:mode: string, default: tree  
:modes: array, modes available in the mode menu, default: ['tree', 'code', 'form', 'text', 'view']  
:lang: string, default: en  
:options: object, extra [jsoneditor options](https://github.com/josdejong/jsoneditor/blob/master/docs/api.md#configuration-options) applied when the editor is created, default: {} (e.g. `{ navigationBar: true, statusBar: true }`)  
@json-change: on json changed  
@json-save: on json save  
@mode-change: on editor mode change, return the mode string  
@provide-editor: after the editor is created, returns the underlying [jsoneditor](https://github.com/josdejong/jsoneditor) instance  
@has-error: on error  

# How to use

## 1. Install using npm

```
npm install vue3-json-editor --save
```

## 2. Use vue-json-editor in the vue component

```vue
<template>
  <div>
    <p>vue-json-editor</p>
    <Vue3JsonEditor
      v-model="json"
      :show-btns="true"
      :expandedOnStart="true"
      @json-change="onJsonChange"
      @mode-change="onModeChange"
    />
  </div>
</template>

<script>
import { defineComponent, reactive, toRefs } from 'vue'
import { Vue3JsonEditor } from 'vue3-json-editor'

export default defineComponent({
  components: {
    Vue3JsonEditor
  },
  setup () {
    function onJsonChange (value) {
      console.log('value:', value)
    }

    function onModeChange (value) {
      console.log('value:', value)
    }

    const state = reactive({
      json: {}
    })

    return {
      ...toRefs(state),
      onJsonChange
    }
  }
})
</script>
```

## 3. Vue Vite Example

```vue
<template>
  <Vue3JsonEditor v-model="json" :show-btns="true" @json-change="onJsonChange" @mode-change="onModeChange" />
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from 'vue'
import { Vue3JsonEditor } from '../dist/vue3-json-editor.esm'

export default defineComponent({
  name: 'App',
  components: {
    Vue3JsonEditor
  },
  setup () {
    function onJsonChange () {
      //
    }
    
    function onModeChange (value) {
      console.log('value:', value)
    }

    const state = reactive({
      json: {}
    })

    return {
      ...toRefs(state),
      onJsonChange
    }
  }
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
```
