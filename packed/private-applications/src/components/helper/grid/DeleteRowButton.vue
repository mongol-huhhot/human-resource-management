<!-- DeleteRowButton.vue -->
<script setup>
const props = defineProps({
  params: {
    type: Object,
    required: true,
  },
})

function onClick(e) {
  e.preventDefault()
  e.stopPropagation()
  props.params?.context?.requestDelete?.(props.params)
}
</script>

<template>
  <v-btn
    icon="mdi-minus"
    size="x-small"
    variant="outlined"
    density="compact"
    title="Delete row"
    @click="onClick"
  />
</template>