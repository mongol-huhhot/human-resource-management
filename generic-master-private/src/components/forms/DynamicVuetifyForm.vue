<!-- DynamicVuetifyForm.vue -->
<script setup>
import { computed } from 'vue'
import DatePicker from '@/components/helper/date/DatePicker.vue'
import {useDbStore} from "@/stores/useDbStore";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  fields: {
    type: Array,
    required: true,
  },
  mode: {
    type: String,
    default: 'self', // self / admin
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  items: {
    type: Array,
    default: () => [],
  },
  showSubmit: {
    type: Boolean,
    default: true,
  },
  tabKey: {
    type: [String, Object],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const dbStore = useDbStore()

const formData = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const visibleFields = computed(() => {
  return props.fields
    .filter(field => field)
    .filter(field => field.showable !== 'hide')
})

function updateField(key, value) {
  formData.value = {
    ...formData.value,
    [key]: value,
  }
}

function getComponent(field) {
  if (field.component) return field.component

  if (field.type === 'select') return 'v-select'
  if (field.type === 'combobox') return 'v-combobox'
  if (field.type === 'textarea') return 'v-textarea'
  if (field.type === 'date' || field.type === 'month') return DatePicker

  return 'v-text-field'
}

function getInputType(field) {
  if (field.type === 'email') return 'email'
  if (field.type === 'password') return 'password'
  if (field.type === 'number') return 'number'
  if (field.type === 'date') return 'date'
  if (field.type === 'time') return 'time'
  return 'text'
}

function buildRules(field) {
  const rules = []
  const validation = field.validation || {}

  if (field.required || validation.required) {
    rules.push(v => !!v || `${field.label}は必須です`)
  }

  if (validation.minLength) {
    rules.push(v =>
      !v || String(v).length >= validation.minLength ||
      `${field.label}は${validation.minLength}文字以上です`
    )
  }

  if (validation.maxLength) {
    rules.push(v =>
      !v || String(v).length <= validation.maxLength ||
      `${field.label}は${validation.maxLength}文字以内です`
    )
  }

  if (validation.email || field.type === 'email') {
    rules.push(v =>
      !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
      'メールアドレス形式が正しくありません'
    )
  }

  if (validation.pattern) {
    const reg = new RegExp(validation.pattern)
    rules.push(v =>
      !v || reg.test(v) ||
      validation.message ||
      `${field.label}の形式が正しくありません`
    )
  }

  return rules
}

function getProps(field) {
  return {
    label: field.label,
    placeholder: field.placeholder,
    readonly: field.readonly,
    disabled: props.disabled || field.disabled,
    clearable: true,
    variant: 'outlined',
    density: 'comfortable',
    type: getInputType(field),
    ...field.props,
  }
}

function submit() {
  console.log('Submitting form with data:', formData.value)
  dbStore.saveData(formData.value) // 例: データ保存の呼び出し
  emit('submit', formData.value)
}
</script>

<template>
  <v-form @submit.prevent="submit">
    <v-row dense>
      <v-col
        v-for="field in visibleFields"
        :key="field.key"
        cols="12"
        sm="6"
        md="4"
      >
        <!-- {{ props.items }} -->
         <!-- {{ field }}::::{{ field.key }}: {{ formData[field.key] }} デバッグ用 -->
        <component
          :is="getComponent(field)"
          :model-value="formData[field.key]"
          v-bind="getProps(field)"
          :items="field.items || []"
          :item-title="field.props?.itemTitle || 'label'"
          :item-value="field.props?.itemValue || 'value'"
          :rules="buildRules(field)"
          @update:model-value="value => updateField(field.key, value)"
        />
      </v-col>
    </v-row>

    <v-row v-if="showSubmit">
      <v-col cols="12" class="text-right">
        <v-btn color="primary" type="submit">
          保存
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>
