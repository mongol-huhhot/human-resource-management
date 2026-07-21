<script setup>
import { computed, ref } from 'vue'
import { buildRules } from '@/composables/useRuleFactory'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fields: { type: Array, required: true },
  mode: { type: String, default: 'self' },
  disabled: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  showSubmit: { type: Boolean, default: true },
  controls: { type: Object, default: null },
  chipcontrols: { type: Object, default: null },
  sqltags: { type: Object, default: null },
  tabConfig: { type: Object, default: () => ({}) },
  commonParams: { type: Object, default: () => ({}) },
  staffCode: { type: String, default: '' },
  isRepeatable: { type: Boolean, default: false },
})

const staffCode = computed(() =>props.staffCode)

const recordId = computed(() => props.modelValue?.record_id)

const controls = computed(() =>props.controls?.[formData.value?.request_status] ?? {})
const chipcontrols = computed(() =>props.chipcontrols?.[formData.value?.request_status] ?? {})

console.log("DynamicVuetifyForm.vue.props===========",props)

const emit = defineEmits(['update:modelValue', 'submit', 'saved'])
const saving = ref(false)

const formRef = ref()
const valid = ref(false)

const validate = async () => {
  const result = await formRef.value?.validate()
  valid.value = result.valid
  console.log("valid.value===",result.valid)
  return result.valid
}

defineExpose({
  validate
})



const formData = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const visibleFields = computed(() =>
  props.fields.filter(field => field && field.showable !== 'hide')
)

const normalFields = computed(() =>
  visibleFields.value.filter(
    field => field.group !== 'attachment'
  )
)

const attachmentFields = computed(() =>
  visibleFields.value.filter(
    field => field.group === 'attachment'
  )
)

// 表示用：Date オブジェクトに変換
function toDisplayValue(field, value) {
  if (field.component !== 'v-date-input' && field.type !== 'date') return value
  if (value == null || value === '') return null
  if (value instanceof Date) return value
  if (typeof value === 'string') {
    const normalized = value.replace(/\//g, '-')
    const d = new Date(normalized + 'T00:00:00')
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

// 保存用：YYYY-MM-DD 文字列に変換
function normalizeDateValue(value) {
  if (value == null || value === '') return ''
  if (value instanceof Date) {
    const yyyy = value.getFullYear()
    const mm = String(value.getMonth() + 1).padStart(2, '0')
    const dd = String(value.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  if (typeof value === 'string') return value.replace(/\//g, '-').slice(0, 10)
  return ''
}

// フィールド更新（field オブジェクトと新しい値を受け取る）
function updateField(field, value) {
  let newValue = value
  if (field.component === 'v-date-input' || field.type === 'date') {
    newValue = normalizeDateValue(value)
  }
  emit('update:modelValue', {
    ...(props.modelValue || {}),
    [field.key]: newValue,
  })
}

// 送信処理
// async function submit(status) {
//   const result = await formRef.value.validate()
//   console.log("validate",result)
//   if (!result.valid) {
//     return
//   }
//     emit('submit', status)
// }

// 送信処理
async function submit() {
  const result = await formRef.value.validate()
  console.log("validate",result)
  if (!result.valid) {
    return
  }
    emit('submit', formData.value)
}
</script>

<template>
  <v-form @submit.prevent="submit" ref="formRef" v-model="valid">

    <v-row >
      <v-col cols="12" class="text-right">
        <div class="d-flex ga-2">
          <v-chip
          :color="chipcontrols?.color"
          variant="flat"
          class="ml-2"
          :prepend-icon="chipcontrols?.icon"
        >
          {{ chipcontrols?.title }}
        </v-chip>
        </div>
      </v-col>
    </v-row>

    <v-row dense>
      <v-col
        v-for="field in normalFields"
        :key="field.key"
        cols="12"
        sm="6"
        md="4"
      >
        <component
          :is="field.component || 'v-text-field'"
          :model-value="
            field.component === 'v-date-input' || field.type === 'date'
              ? toDisplayValue(field, formData[field.key])
              : formData[field.key]
          "
          v-bind="field.props || {}"
          :label="field.label"
          :type="field.component === 'v-date-input' ? undefined : field.type"
          :readonly="field.readonly"
          :disabled="disabled || field.disabled"
          :items="field.items || field.props?.items || []"
          :item-title="field.props?.itemTitle || field.props?.['item-title'] || 'label'"
          :item-value="field.props?.itemValue || field.props?.['item-value'] || 'value'"
          :rules="buildRules(field)"
          @update:model-value="value => updateField(field, value)"
          validate-on="input"
          :staffCode="staffCode"
        />
      </v-col>
    </v-row>

    <v-row v-if="showSubmit">
      <v-col cols="12" class="text-right">
        <v-btn class="me-2" color="primary" @click="submit('draft')"  
        :loading="saving" :disabled="props.disabled || !valid || controls?.draftSave?.disabled" v-show="controls?.draftSave?.show" >
          下書き保存
        </v-btn>
        <v-btn class="me-2" color="primary" @click="submit('submitted')" 
        :loading="saving" :disabled="props.disabled || !valid || controls?.submit?.disabled" v-show="controls?.draftSave?.show">
          登録・変更申請
        </v-btn>
      </v-col>
    </v-row>

    <v-card
      v-if="attachmentFields.length"
      variant="flat"
      v-for="field in attachmentFields"
        :key="field.key"
    >

    <v-divider class="my-6" />

      <v-card-title>
        {{ field.label }}
      </v-card-title>
    
      <v-card-text>
        <component
          :is="field.component || 'v-text-field'"
          :model-value="
            field.component === 'v-date-input' || field.type === 'date'
              ? toDisplayValue(field, formData[field.key])
              : formData[field.key]
          "
          v-bind="field.props || {}"
          :label="field.label"
          :type="field.component === 'v-date-input' ? undefined : field.type"
          :readonly="field.readonly"
          :disabled="disabled || field.disabled"
          :items="field.items || field.props?.items || []"
          :item-title="field.props?.itemTitle || field.props?.['item-title'] || 'label'"
          :item-value="field.props?.itemValue || field.props?.['item-value'] || 'value'"
          :rules="buildRules(field)"
          @update:model-value="value => updateField(field, value)"
          :staffCode="staffCode"
          :recordId="recordId"
           :is-repeatable="isRepeatable"
        />
      </v-card-text>
    </v-card>

  </v-form>
</template>
