<template>
  <Vue3JsonEditor v-model="json" :show-btns="true" @json-change="onJsonChange" @mode-change="onModeChange"/>
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
      onJsonChange,
      onModeChange
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
