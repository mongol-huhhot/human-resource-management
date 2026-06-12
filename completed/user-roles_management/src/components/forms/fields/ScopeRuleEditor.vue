<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [Object, String, null],
    default: null,
  },
  label: {
    type: String,
    default: 'データ参照範囲',
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

const scopeType = ref('all')
const scopeText = ref('{}')

const scopeMap = {
  all: {},
  own: { staff_code: '<%own_staff_code%>' },
  department: { department_id: '<%own_department_id%>' },
}

function safeStringify(value) {
  return JSON.stringify(value ?? {}, null, 2)
}

function parseValue(value) {
  if (!value) return {}

  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }

  return value
}

function detectScopeType(value) {
  const json = JSON.stringify(value ?? {})

  if (json === JSON.stringify(scopeMap.all)) return 'all'
  if (json === JSON.stringify(scopeMap.own)) return 'own'
  if (json === JSON.stringify(scopeMap.department)) return 'department'

  return 'custom'
}

const jsonError = computed(() => {
  try {
    JSON.parse(scopeText.value || '{}')
    return ''
  } catch {
    return 'scope_rule のJSON形式が正しくありません'
  }
})

watch(
  () => props.modelValue,
  value => {
    const parsed = parseValue(value)
    scopeType.value = detectScopeType(parsed)
    scopeText.value = safeStringify(parsed)
  },
  { immediate: true, deep: true }
)

watch(scopeType, value => {
  if (value === 'custom') return

  scopeText.value = safeStringify(scopeMap[value])

  emit('update:modelValue', scopeMap[value])
})

watch(scopeText, value => {
  if (jsonError.value) return

  const parsed = JSON.parse(value || '{}')

  if (scopeType.value !== 'custom') {
    const detected = detectScopeType(parsed)
    if (detected !== scopeType.value) {
      scopeType.value = 'custom'
    }
  }

  emit('update:modelValue', parsed)
})
</script>

<template>
  <v-card variant="outlined" class="pa-4 mb-4">
    <div class="text-h6 mb-3">
      {{ label }}
    </div>

    <v-radio-group
      v-model="scopeType"
      :disabled="disabled || readonly"
    >
      <v-radio label="全体" value="all" />
      <v-radio label="自分のみ" value="own" />
      <v-radio label="所属部署" value="department" />
      <v-radio label="手入力" value="custom" />
    </v-radio-group>

    <v-textarea
      v-model="scopeText"
      label="scope_rule JSON"
      variant="outlined"
      rows="3"
      auto-grow
      :readonly="readonly"
      :disabled="disabled"
      :error="!!jsonError"
      :error-messages="jsonError"
    />
  </v-card>
</template>