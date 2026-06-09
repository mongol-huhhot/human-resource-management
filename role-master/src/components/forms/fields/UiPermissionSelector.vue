<!-- UiPermissionSelector.vue -->
<script setup>
import { computed, ref, watch } from 'vue'
import { useDataStore } from '@/stores/DataStore'

const model = defineModel({
  type: Object,
  default: () => ({
    ui_includes: [],
    ui_excludes: [],
  }),
})

const props = defineProps({
  label: {
    type: String,
    default: 'UI項目権限',
  },

  appCode: {
    type: String,
    default: '',
  },

  processCode: {
    type: String,
    default: '',
  },

  disabled: Boolean,
  readonly: Boolean,
})

const dataStore = useDataStore()

const loading = ref(false)
const allItems = ref([])

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  if (!value) return []

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
}

function ensureModel() {
  model.value = {
    ...(model.value || {}),
    ui_includes: normalizeArray(model.value?.ui_includes),
    ui_excludes: normalizeArray(model.value?.ui_excludes),
  }
}

function getFieldLabel(row) {
  const def = row.field_definition || {}

  return (
    def.label ||
    row.item_description?.label ||
    row.l_item_code ||
    row.g_item_code
  )
}

function normalizeDictionaryRows(rows = []) {
  return rows
    .filter(row => row?.enabled !== 'inactive')
    .filter(row => row?.showable !== 'hide')
    .map(row => ({
      label: getFieldLabel(row),
      value: row.l_item_code || row.g_item_code,
      raw: row,
    }))
}

async function loadItems() {
  if (!props.appCode || !props.processCode) {
    allItems.value = []
    return
  }

  loading.value = true

  try {
    const result = await dataStore.runLoad(
      'masters.get_item_dictionary',
      {
        SQLTAG: 'masters.get_item_dictionary',
        category_code: props.appCode,
        sub_category_code: props.processCode,
        enabled: 'active',
      },
      'dictionary'
    )

    const rows =
      result?.dictionary?.result ||
      result?.result ||
      result?.data?.dictionary ||
      result?.data ||
      []

    allItems.value = normalizeDictionaryRows(Array.isArray(rows) ? rows : [])
  } catch (e) {
    console.error('UiPermissionSelector loadItems error:', e)
    allItems.value = []
  } finally {
    loading.value = false
  }
}

const includeItems = computed(() => {
  const excludes = normalizeArray(model.value?.ui_excludes)

  return allItems.value.filter(item => !excludes.includes(item.value))
})

const excludeItems = computed(() => {
  const includes = normalizeArray(model.value?.ui_includes)

  return allItems.value.filter(item => !includes.includes(item.value))
})

function updateIncludes(value) {
  const includes = normalizeArray(value)
  const excludes = normalizeArray(model.value?.ui_excludes)
    .filter(code => !includes.includes(code))

  model.value = {
    ...(model.value || {}),
    ui_includes: includes,
    ui_excludes: excludes,
  }
}

function updateExcludes(value) {
  const excludes = normalizeArray(value)
  const includes = normalizeArray(model.value?.ui_includes)
    .filter(code => !excludes.includes(code))

  model.value = {
    ...(model.value || {}),
    ui_includes: includes,
    ui_excludes: excludes,
  }
}

watch(
  () => model.value,
  () => {
    ensureModel()
  },
  { immediate: true }
)

watch(
  () => [props.appCode, props.processCode],
  async () => {
    await loadItems()
  },
  { immediate: true }
)
</script>

<template>
  <v-card variant="outlined" class="pa-3">
    <div class="text-subtitle-1 font-weight-bold mb-3">
      {{ label }}
    </div>

    <v-alert
      v-if="!appCode || !processCode"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      先にアプリと機能を選択してください。
    </v-alert>

    <v-row dense>
      <v-col cols="12" md="6">
        <v-select
          :model-value="model?.ui_includes"
          label="許可項目 includes"
          :items="includeItems"
          item-title="label"
          item-value="value"
          multiple
          chips
          closable-chips
          clearable
          variant="outlined"
          density="comfortable"
          :loading="loading"
          :disabled="disabled || readonly || !appCode || !processCode"
          @update:model-value="updateIncludes"
        />
      </v-col>

      <v-col cols="12" md="6">
        <v-select
          :model-value="model?.ui_excludes"
          label="禁止項目 excludes"
          :items="excludeItems"
          item-title="label"
          item-value="value"
          multiple
          chips
          closable-chips
          clearable
          variant="outlined"
          density="comfortable"
          :loading="loading"
          :disabled="disabled || readonly || !appCode || !processCode"
          @update:model-value="updateExcludes"
        />
      </v-col>
    </v-row>

    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      class="mt-2"
    >
      includes に選択した項目は excludes から非表示になります。excludes に選択した項目も includes から非表示になります。
    </v-alert>
  </v-card>
</template>
