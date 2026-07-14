<template>
  <div class="time-editor">
    <VTextField
      :label="label"
      type="time"
      v-model="timeHHmm"
      :disabled="disabled"
      :placeholder="placeholder"
      density="compact"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  modelValue: { type: String, required: true }, // e.g. "2025-07-01T12:00"
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: 'HH:MM' }
})

const emit = defineEmits(['update:modelValue'])

/** v-model proxy just for HH:mm */
const timeHHmm = computed({
  get() {
    const d = dayjs(props.modelValue)
    return d.isValid() ? d.format('HH:mm') : ''
  },
  set(val) {
    if (!val) return
    const [h, m] = val.split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return

    const base = dayjs(props.modelValue)
    if (!base.isValid()) return

    // Keep the original date; replace time; emit ISO-like string with "T"
    const next = base.hour(h).minute(m).second(0).millisecond(0)
    emit('update:modelValue', next.format('YYYY-MM-DDTHH:mm'))
    // If you prefer full ISO with timezone/Z, use: next.toDate().toISOString()
  }
})
</script>

<style scoped>
.time-editor { display: flex; flex-direction: column; gap: 4px; }
</style>
