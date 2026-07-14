<!-- DeleteRowButton.vue -->
<script setup>
const props = defineProps({
  params: { type: Object, required: true },
})

function onClick(e) {
  e.preventDefault()
  e.stopPropagation() // ✅ don’t trigger row click/selection
  props.params?.context?.requestDelete?.(props.params)
}
</script>

<template>
  <button
    type="button"
    class="ag-delete-btn"
    title="Delete row"
    @click="onClick"
  >
    −
  </button>
</template>

<style scoped>
.ag-delete-btn{
  width: 22px;
  height: 22px;
  line-height: 20px;
  border: 1px solid rgba(0,0,0,.25);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.ag-delete-btn:hover{
  background: rgba(0,0,0,.06);
}
</style>