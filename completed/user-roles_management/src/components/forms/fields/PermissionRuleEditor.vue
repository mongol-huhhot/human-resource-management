<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [Object, null],
    default: null,
  },
  label: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  items: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const displayTitle = computed(() => props.title || props.label)

const mode = ref('all')
const selectedFields = ref([])

function normalizeValue(value) {
  if (!value) return null

  if (Array.isArray(value.includes)) {
    return {
      includes: [...value.includes],
    }
  }

  if (Array.isArray(value.excludes)) {
    return {
      excludes: [...value.excludes],
    }
  }

  return null
}

function buildValue() {
  if (mode.value === 'all') {
    return null
  }

  if (mode.value === 'includes') {
    return {
      includes: [...selectedFields.value],
    }
  }

  if (mode.value === 'excludes') {
    return {
      excludes: [...selectedFields.value],
    }
  }

  if (mode.value === 'none') {
    return {
      includes: [],
    }
  }

  return null
}

function isSameJson(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

// 親 → 子
watch(
  () => props.modelValue,
  value => {
    const normalized = normalizeValue(value)

    if (!normalized) {
      if (mode.value !== 'all') mode.value = 'all'
      if (selectedFields.value.length > 0) selectedFields.value = []
      return
    }

    if (Array.isArray(normalized.includes)) {
      const nextMode = normalized.includes.length === 0 ? 'none' : 'includes'

      if (mode.value !== nextMode) mode.value = nextMode

      if (!isSameJson(selectedFields.value, normalized.includes)) {
        selectedFields.value = [...normalized.includes]
      }
    }

    if (Array.isArray(normalized.excludes)) {
      if (mode.value !== 'excludes') mode.value = 'excludes'

      if (!isSameJson(selectedFields.value, normalized.excludes)) {
        selectedFields.value = [...normalized.excludes]
      }
    }
  },
  { immediate: true, deep: true }
)

// 子 → 親
watch(
  [mode, selectedFields],
  () => {
    const nextValue = buildValue()

    if (!isSameJson(nextValue, props.modelValue)) {
      emit('update:modelValue', nextValue)
    }
  },
  { deep: true }
)

const previewJson = computed(() => {
  const value = buildValue()
  return value === null ? 'null' : JSON.stringify(value, null, 2)
})

const actions = [
  { label: '作成', value: 'create' },
  { label: '保存', value: 'save' },
  { label: '更新', value: 'update' },
  { label: '削除', value: 'delete' },
  { label: '申請', value: 'submit' },
  { label: '承認', value: 'approve' },
  { label: '却下', value: 'reject' },
]

</script>

<template>
  <v-card variant="outlined" class="pa-3">
    <div class="text-subtitle-1 font-weight-bold mb-2">
      {{ displayTitle }}
    </div>

    <v-radio-group
      v-model="mode"
      :disabled="disabled || readonly"
      density="compact"
    >
      <v-radio label="全項目許可" value="all" />
      <v-radio label="指定項目のみ許可" value="includes" />
      <v-radio label="指定項目を除外" value="excludes" />
      <v-radio label="すべて禁止" value="none" />
    </v-radio-group>

    <v-combobox
      v-if="mode === 'includes' || mode === 'excludes'"
      v-model="selectedFields"
      :items="actions"
      label="対象項目"
      multiple
      chips
      clearable
      item-title="label"
      item-value="value"
      variant="outlined"
      density="comfortable"
      :disabled="disabled || readonly"
    />

    <v-textarea
      :model-value="previewJson"
      label="保存されるJSON"
      readonly
      rows="3"
      variant="outlined"
      density="compact"
    />
  </v-card>
</template>