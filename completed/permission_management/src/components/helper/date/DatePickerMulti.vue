<script setup>
import { ref } from 'vue'
import { VAutocomplete } from 'vuetify/components'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: '選択' },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 12 }
})
const emit = defineEmits(['update:modelValue'])

const items = Array.from({ length: props.max - props.min + 1 }, (_, i) => props.min + i)
const localValue = ref([...props.modelValue])

function update(val) {
  console.log("DataPickerMulti", val)
  emit('update:modelValue', val)
}
</script>

<template>
  <VAutocomplete
    v-model="localValue"
    :items="items"
    :label="label"
    multiple
    chips
    outlined
    density="compact"
    @update:modelValue="update"
  />
</template>
