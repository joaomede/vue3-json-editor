<template>
  <div class="example-json">
    <div class="example-demo">vue3-json-editor demo</div>
    <Vue3JsonEditor v-model="state.json"
      :show-btns="true"
      :expandedOnStart="false"
      mode="code"
      lang="zh"
      @json-change="onJsonChange"
      @json-save="onJsonSave"
      @has-error="onError">
    </Vue3JsonEditor>
    <button type="button" @click="resetJson">reset</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'
import { Vue3JsonEditor } from '../components/vue3-json-editor'

export default defineComponent({
  components: {
    Vue3JsonEditor
  },
  setup () {
    const state = reactive({
      json: [
        { name: 'Dirk', age: 1234 },
        { name: 'Jason' }
      ]
    })

    function onJsonChange (value) {
      console.log('value:', value)
    }

    function onJsonSave (value) {
      console.log('value:', value)
    }

    function onError (value) {
      console.log('value:', value)
    }

    function resetJson () {
      state.json = [
        { name: 'Dirk', age: 1234 },
        { name: 'Jason' }
      ]
    }

    return {
      state,
      resetJson,
      onJsonChange,
      onJsonSave,
      onError
    }
  }
})

</script>

<style lang="scss">

</style>
