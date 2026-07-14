<script setup>
import { computed, ref } from 'vue'
import { useDataStore } from '@/stores/DataStore'
import { buildSaveParams } from '@/composables/formParamBuilder'
import { buildSaveParams } from '@/composables/formParamBuilder'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  fields: {
    type: Array,
    default: () => [],
  },
  sqltags: {
    type: Object,
    default: null,
  },
  tabConfig: {
    type: Object,
    default: () => ({}),
  },
  commonParams: {
    type: Object,
    default: () => ({}),
  },
  mode: {
    type: String,
    default: 'single', // single / repeatable
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const dataStore = useDataStore()
const saving = ref(false)

const formData = computed({
  get: () => props.modelValue || {},
  set: value => emit('update:modelValue', value),
})

function toDateValue(value) {
  if (!value) return null
  if (value instanceof Date) return value
  return new Date(`${value}T00:00:00`)
}

function toDateString(value) {
  if (!value) return null
  if (typeof value === 'string') return value.slice(0, 10)

  const yyyy = value.getFullYear()
  const mm = String(value.getMonth() + 1).padStart(2, '0')
  const dd = String(value.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getModelValue(field) {
  const value = formData.value[field.key]

  if (field.component === 'v-date-input') {
    return toDateValue(value)
  }

  return value
}

function updateField(field, value) {
  emit('update:modelValue', {
    ...(props.modelValue || {}),
    [field.key]: field.component === 'v-date-input'
      ? toDateString(value)
      : value,
  })
}

async function save() {
  if (!props.sqltags?.save) {
    console.error('sqltags.save is not defined')
    return
  }

  saving.value = true

  try {
    const params = buildSaveParams(
      formData.value,
      props.tabConfig,
      props.commonParams,
    )

    const result = await dataStore.saveData(
      props.sqltags.save,
      params,
    )

    emit('saved', result)
  } catch (error) {
    console.error('DynamicVuetifyForm save error:', error)
  } finally {
    saving.value = false
  }
}



</script>

<template>
  <v-form>
    <v-row dense>
      <v-col
        v-for="field in fields"
        :key="field.key"
        cols="12"
        md="6"
      >
      <!-- {{ field.key }}: {{ formData[field.key] }} -->
        <component
          :is="field.component || 'v-text-field'"
          :model-value="formData[field.key]"
          v-bind="field.props || {}"
          :label="field.label"
          :type="field.type"
          :readonly="field.readonly"
          :disabled="disabled || field.disabled"
          @update:model-value="value => updateField(field.key, value)"
        />
      </v-col>
    </v-row>

    <div
      v-if="mode === 'single'"
      class="d-flex justify-end mt-4"
    >
      <v-btn
        color="primary"
        :loading="saving"
        :disabled="!props.sqltags?.save"
        @click="save"
      >
        保存
      </v-btn>
    </div>
  </v-form>
</template>
