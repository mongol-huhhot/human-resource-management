<script setup>
import { ref, watch, computed } from 'vue'
import dayjs from 'dayjs'

defineOptions({
  name: 'DatePicker',
  inheritAttrs: false,
})

const props = defineProps({
  modelValue: {
    type: [String, Date],
    default: null,
  },
  label: {
    type: String,
    default: '日付',
  },
  mode: {
    type: String,
    default: 'date',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const menu = ref(false)
const tempDate = ref(null)

const formatString = computed(() =>
  props.mode === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD'
)

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  return dayjs(props.modelValue).format(formatString.value)
})

watch(
  () => props.modelValue,
  val => {
    tempDate.value = val || null
  },
  { immediate: true }
)

function onSelectDate(val) {
  if (!val) return

  const value = dayjs(val).format(formatString.value)
  emit('update:modelValue', value)
  menu.value = false
}

function clearDate() {
  tempDate.value = null
  emit('update:modelValue', null)
}
</script>

<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{ props: menuProps }">
      <v-text-field
        v-bind="{ ...$attrs, ...menuProps }"
        :model-value="displayValue"
        :label="label"
        prepend-icon="mdi-calendar"
        readonly
        :disabled="disabled"
        :clearable="clearable"
        variant="outlined"
        density="comfortable"
        @click:clear.stop="clearDate"
      />
    </template>

    <v-date-picker
      v-model="tempDate"
      color="primary"
      :view-mode="mode === 'month' ? 'year' : 'month'"
      @update:model-value="onSelectDate"
    />
  </v-menu>
</template>
