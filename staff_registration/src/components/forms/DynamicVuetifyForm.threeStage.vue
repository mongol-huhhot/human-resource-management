<!-- DynamicVuetifyForm.vue -->
<script setup>
import { computed, ref } from 'vue'
import { watch } from 'vue'
import { useDefaultValueResolver } from '@/composables/useDefaultValueResolver'
import { useDataStore } from '@/stores/DataStore'
import { buildRules } from '@/composables/useRuleFactory'
import { mergeConditionParams, } from '@/composables/formParamBuilder'

const props = defineProps({
  modelValue: { type: Object, required: true },
  // 3段表示用: 現在有効データ（staff_profile_data / current）
  currentData: { type: Object, default: () => ({}) },
  // 3段表示用: 申請中/下書きデータ（staff_profile_request / draft/submitted）
  requestData: { type: Object, default: () => ({}) },
  // true の場合、各項目を「現在値・申請値・入力欄」の3段で表示する
  threeStage: { type: Boolean, default: false },
  // draft 以外でも入力欄を表示したい場合に使用。未指定なら request_status から自動判定。
  editableRequestStatuses: { type: Array, default: () => ['draft', 'rejected', 'new'] },
  fields: { type: Array, required: true },
  mode: { type: String, default: 'self' },
  disabled: { type: Boolean, default: false },
  items: { type: Object, default: () => ({}) },
  showSubmit: { type: Boolean, default: true },
  sqltags: { type: Object, default: null },
  tabConfig: { type: Object, default: () => ({}) },
  propertyParams: { type: Object, default: () => ({}) },
  uiCondition: { type: Object, default: () => ({}) },
  runTimeParams: { type: Object, default: () => ({}) },
  optionParams: { type: Object, default: () => ({}) },
  selectedRows:{
    type: Array,
    default: ()=>[]
  },
  selectedUserIds:{
    type: Array,
    default: ()=>[]
  },
})

const isBulkMode = computed(() => props.selectedUserIds.length > 1)

const submitButtonText = computed(() => {
  return isBulkMode.value ? '一括実行' : '保存'
})

const operationText = computed(() => {
  if (operation.value === 'add') return '追加'
  if (operation.value === 'remove') return '削除'
  if (operation.value === 'replace') return '置換'
  return ''
})

const emit = defineEmits(['update:modelValue', 'submit', 'saved'])
const dataStore = useDataStore()
const saving = ref(false)

const formData = computed({
  get: () => props.modelValue || {},
  set: value => emit('update:modelValue', value),
})

function getComponent(field) {
  return field.component || 'v-text-field'
}

function checkDependsOn(field) {
  if (!field.dependsOn) return true

  const { field: targetField, operator = '=', value } = field.dependsOn
  const currentValue = formData.value?.[targetField]

  if (operator === '=') return currentValue === value
  if (operator === '!=') return currentValue !== value
  if (operator === 'in') return Array.isArray(value) && value.includes(currentValue)
  if (operator === 'notIn') return Array.isArray(value) && !value.includes(currentValue)
  if (operator === 'empty') return currentValue === null || currentValue === undefined || currentValue === ''
  if (operator === 'notEmpty') return currentValue !== null && currentValue !== undefined && currentValue !== ''

  return true
}

const visibleFields = computed(() =>
  props.fields
    .filter(field => field)
    .filter(field => field.showable !== 'hide')
    .filter(field => field.hidden !== true)
    .filter(field => checkDependsOn(field))
)

function getColProps(field) {
  const display = field.display || {}

  return {
    cols: display.cols || 12,
    sm: display.sm || 6,
    md: display.md || 4,
    lg: display.lg,
    xl: display.xl,
  }
}

function normalizeLoadedFormData(data, fields = []) {
  const next = { ...(data || {}) }

  for (const field of fields) {
    const key = field.key
    if (!key) continue

    if (
      field.type === 'array' ||
      field.db?.dataType === 'text[]' ||
      field.props?.multiple === true
    ) {
      next[key] = normalizeArrayValue(next[key])
    }
  }

  return next
}

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

function normalizeValue(field, value) {
  let newValue = value

  if (field.component === 'v-date-input' || field.type === 'date') {
    newValue = normalizeDateValue(value)
  }

  if (typeof newValue === 'string') {
    if (field.normalize?.trim) {
      newValue = newValue.trim()
    }
  }

  return newValue
}

function updateField(field, value) {
  const newValue = normalizeValue(field, value)

  emit('update:modelValue', {
    ...(props.modelValue || {}),
    [field.key]: newValue,
  })
}

function getFieldItems(field) {
  if (Array.isArray(field.items) && field.items.length > 0) {
    return field.items
  }

  if (Array.isArray(field.options?.items) && field.options.items.length > 0) {
    return field.options.items
  }

  if (
    field.itemsKey &&
    Array.isArray(props.items?.[field.itemsKey])
  ) {
    return props.items[field.itemsKey]
  }

  if (
    field.masterKey &&
    Array.isArray(dataStore.formMasters?.[field.masterKey])
  ) {
    return dataStore.formMasters[field.masterKey]
  }

  if (
    field.dictionaryKey &&
    Array.isArray(dataStore.formMasters?.[field.dictionaryKey])
  ) {
    return dataStore.formMasters[field.dictionaryKey]
  }

  if (Array.isArray(field.props?.items)) {
    return field.props.items
  }

  return []
}

function getItemTitle(field) {
  return (
    field.itemTitle ||
    field.item_title ||
    field.options?.itemTitle ||
    field.options?.item_title ||
    field.props?.itemTitle ||
    field.props?.item_title ||
    field.props?.['item-title'] ||
    'label'
  )
}

function getItemValue(field) {
  return (
    field.itemValue ||
    field.item_value ||
    field.options?.itemValue ||
    field.options?.item_value ||
    field.props?.itemValue ||
    field.props?.item_value ||
    field.props?.['item-value'] ||
    'value'
  )
}

function cleanProps(field) {
  const {
    items,
    itemTitle,
    itemValue,
    item_title,
    item_value,
    'item-title': itemTitleKebab,
    'item-value': itemValueKebab,
    ...rest
  } = field.props || {}

  return {
    clearable: true,
    variant: 'outlined',
    density: 'comfortable',
    placeholder: field.placeholder,
    ...rest,
  }
}

// function buildSaveData(data) {
//   const base = { ...(data || {}) }

//   const roleCodes = Array.isArray(base.role_codes)
//     ? base.role_codes.filter(Boolean)
//     : base.role_codes
//       ? [base.role_codes]
//       : []

//   const userIds = props.selectedUserIds?.length
//     ? props.selectedUserIds
//     : base.user_id
//       ? [base.user_id]
//       : []

//   const currentOperation = isBulkMode.value
//       ? (operation.value || 'add')
//       : 'replace'

//   return userIds.map(userId => ({
//     id: base.id || null,
//     user_id: userId,
//     role_codes: roleCodes,
//     operation: currentOperation,
//     start_date: base.start_date,
//     end_date: base.end_date,
//     enabled: base.enabled || 'active',
//     remarks: base.remarks || '',
//   }))
// }

async function submit() {
  if (!props.sqltags?.save) {
    emit('submit', formData.value)
    return
  }

  saving.value = true

  const saveData = Array.isArray(formData.value) ? formData.value : [formData.value]
  try {
    const payload = {
      LOOP: saveData,
    }

    const result = await dataStore.runSave(
      props.sqltags.save,
      payload,
      props.propertyParams,
    )

    emit('saved', result)
    emit('submit', payload)

    dataStore.states.forceFresh = "" + Math.random()

  } finally {
    saving.value = false
  }
}

function isSameJson(a, b) {
  return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {})
}

const { applyDefaultValues } = useDefaultValueResolver()

watch(
  () => [props.fields, props.modelValue],
  ([fields, modelValue]) => {
    let next = normalizeLoadedFormData(modelValue, fields)

    next = applyDefaultValues(
      next,
      fields,
      props.propertyParams
    )

    if (!isSameJson(next, modelValue)) {
      emit('update:modelValue', next)
    }
  },
  { immediate: true }
)

function normalizeArrayValue(value) {
  if (Array.isArray(value)) return value
  if (value == null || value === '') return []

  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    return value
      .slice(1, -1)
      .split(',')
      .map(v => v.trim().replace(/^"|"$/g, ''))
      .filter(Boolean)
  }

  if (typeof value === 'string' && value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return [value]
} ///ddddd

function toDisplayValue(field, value) {
  if (field.type === 'array' || field.db?.dataType === 'text[]') {
    return normalizeArrayValue(value)
  }

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

function getRawValue(source, field) {
  if (!source || !field?.key) return undefined
  return source[field.key]
}

function isEmptyValue(value) {
  return value === null || value === undefined || value === '' ||
    (Array.isArray(value) && value.length === 0)
}

function getCurrentValue(field) {
  return getRawValue(props.currentData, field)
}

function getRequestValue(field) {
  return getRawValue(props.requestData, field)
}

function getRequestStatus() {
  return props.requestData?.request_status ||
    props.requestData?.status_code ||
    formData.value?.request_status ||
    formData.value?.status_code ||
    props.runTimeParams?.request_status ||
    props.runTimeParams?.status_code ||
    props.runTimeParams?.__mode ||
    ''
}

const canEditForm = computed(() => {
  if (props.disabled) return false
  const status = getRequestStatus()
  if (!status) return true
  return props.editableRequestStatuses.includes(status)
})

function normalizeComparableValue(field, value) {
  if (field.component === 'v-date-input' || field.type === 'date') {
    return normalizeDateValue(value)
  }

  if (field.type === 'array' || field.db?.dataType === 'text[]' || field.props?.multiple === true) {
    return normalizeArrayValue(value)
  }

  return value ?? ''
}

function isChanged(field) {
  const current = normalizeComparableValue(field, getCurrentValue(field))
  const target = normalizeComparableValue(field, formData.value?.[field.key])
  return JSON.stringify(current) !== JSON.stringify(target)
}

function getDisplayLabel(field, value) {
  if (isEmptyValue(value)) return '未設定'

  const items = getFieldItems(field)
  const titleKey = getItemTitle(field)
  const valueKey = getItemValue(field)

  const toLabel = v => {
    const item = items.find(i => i?.[valueKey] === v)
    if (item) return item?.[titleKey] ?? item?.label ?? item?.name ?? v
    return v
  }

  if (Array.isArray(value)) return value.map(toLabel).join('、') || '未設定'
  if (field.component === 'v-date-input' || field.type === 'date') return normalizeDateValue(value) || '未設定'
  if (typeof value === 'boolean') return value ? 'はい' : 'いいえ'
  if (typeof value === 'object') return JSON.stringify(value)
  return toLabel(value)
}

function getRequestDisplayValue(field) {
  const requestValue = getRequestValue(field)
  if (!isEmptyValue(requestValue)) return requestValue
  return formData.value?.[field.key]
}

function getFieldStatusText(field) {
  if (!props.threeStage) return ''
  return isChanged(field) ? '変更あり' : '変更なし'
}

function getFieldStatusColor(field) {
  return isChanged(field) ? 'warning' : 'default'
}

const operation = ref('add')

async function handleDelete() {
  console.log("props.sqltags===", props.sqltags)

  if (!props.sqltags?.delete) {
    alert('削除SQLタグが設定されていません。')
    return
  }
    
  if (!confirm('このデータを削除しますか？')) return

  const params = mergeConditionParams({
    condition: props.tabConfig?.condition || {},
    propertyParams: props.propertyParams || {},
    uiCondition: props.uiCondition || {},
    runTimeParams: props.runTimeParams || {},
    optionParams: props.optionParams || {},
  })

  const result = await dataStore.runSave(props.sqltags.delete, params)

  if (result.code !== 0) {
    alert('削除に失敗しました。')
    return
  }

  dataStore.states.forceFresh = ""+Math.random()

  emit('saved', result)
}

</script>

<template>
  <v-form @submit.prevent="submit">
    <!-- {{props.sqltags}} -->
    <v-alert
      v-if="threeStage && !canEditForm"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      この申請は提出済み、または編集不可状態です。現在値と申請値の確認のみ可能です。
    </v-alert>
    <v-row dense>
      <v-col
        v-for="field in visibleFields"
        :key="field.key"
        v-bind="getColProps(field)"
      >
        <v-card
          v-if="threeStage"
          variant="outlined"
          class="pa-3 h-100"
        >
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-2 font-weight-bold">
              {{ field.label }}
              <span v-if="field.required" class="text-error">*</span>
            </div>
            <v-chip
              size="x-small"
              :color="getFieldStatusColor(field)"
              variant="tonal"
            >
              {{ getFieldStatusText(field) }}
            </v-chip>
          </div>

          <v-sheet
            class="pa-2 mb-2 rounded"
            color="grey-lighten-4"
          >
            <div class="text-caption text-medium-emphasis">現在値</div>
            <div class="text-body-2">
              {{ getDisplayLabel(field, getCurrentValue(field)) }}
            </div>
          </v-sheet>

          <v-sheet
            class="pa-2 mb-3 rounded"
            :color="isChanged(field) ? 'orange-lighten-5' : 'grey-lighten-5'"
          >
            <div class="text-caption text-medium-emphasis">申請中・編集中の値</div>
            <div class="text-body-2">
              {{ getDisplayLabel(field, getRequestDisplayValue(field)) }}
            </div>
          </v-sheet>

          <component
            :is="getComponent(field)"
            :model-value="
              field.component === 'v-date-input' || field.type === 'date'
                ? toDisplayValue(field, formData[field.key])
                : formData[field.key]
            "
            v-bind="cleanProps(field)"
            :field="field"
            :label="`入力：${field.label}`"
            :type="field.component === 'v-date-input' ? undefined : field.type"
            :readonly="field.readonly || !canEditForm"
            :disabled="!canEditForm || field.disabled"
            :items="getFieldItems(field)"
            :item-title="getItemTitle(field)"
            :item-value="getItemValue(field)"
            :rules="buildRules(field)"
            @update:model-value="value => updateField(field, value)"
          />

          <div
            v-if="field.help"
            class="text-caption text-medium-emphasis mt-1"
          >
            {{ field.help }}
          </div>
        </v-card>

        <template v-else>
          <component
            :is="getComponent(field)"
            :model-value="
              field.component === 'v-date-input' || field.type === 'date'
                ? toDisplayValue(field, formData[field.key])
                : formData[field.key]
            "
            v-bind="cleanProps(field)"
            :field="field"
            :label="field.label"
            :type="field.component === 'v-date-input' ? undefined : field.type"
            :readonly="field.readonly"
            :disabled="disabled || field.disabled"
            :items="getFieldItems(field)"
            :item-title="getItemTitle(field)"
            :item-value="getItemValue(field)"
            :rules="buildRules(field)"
            @update:model-value="value => updateField(field, value)"
          />

          <div
            v-if="field.help"
            class="text-caption text-medium-emphasis mt-1"
          >
            {{ field.help }}
          </div>
        </template>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-alert
          v-if="isBulkMode"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          対象：{{ selectedUserIds.length }}名 /
          操作：{{ operationText }}
        </v-alert>

        <v-radio-group
          v-if="isBulkMode"
          v-model="operation"
          inline
        >
          <v-radio color="success" label="追加" value="add" />
          <v-radio color="warning" label="削除" value="remove" />
          <v-radio color="error" label="置換" value="replace" />
        </v-radio-group>

        <v-alert
          v-if="isBulkMode && operation === 'replace'"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          置換は、対象ユーザーの既存ロールを選択したロールで上書きします。
        </v-alert>
      </v-col>  
    </v-row>
    <v-row v-if="showSubmit">
      <v-col cols="12" class="text-right">
        <v-btn
          color="primary"
          type="submit"
          :loading="saving"
          :disabled="props.disabled || !canEditForm"
           class="mr-3"
        >
          {{ submitButtonText }}
        </v-btn>
        <v-btn
          color="error"
          variant="outlined"
          prepend-icon="mdi-delete"
          :disabled="props.runTimeParams?.__mode === 'new'"
          @click="handleDelete"
        >
          削除
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>
