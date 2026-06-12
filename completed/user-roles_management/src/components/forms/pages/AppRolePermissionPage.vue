<!-- AppRolePermissionPage.vue -->
<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useDataStore } from '@/stores/DataStore'

const model = defineModel({
  type: Object,
  default: () => ({
    app_code: null,
    process_code: null,
    role_code: null,
    status_code: null,

    access_allowed: true,

    view_includes: [],
    view_excludes: [],

    edit_includes: [],
    edit_excludes: [],

    scope_codes: [],

    enabled: 'active',
    show_order: 0,
  }),
})


const props = defineProps({
  tabCode: String,
  tabInfo: Object,
  tabConfig: Object,
  commonParams: {
    type: Object,
    default: () => ({}),
  },
  currentRow: Object,
  selectedRows: {
    type: Array,
    default: () => [],
  },
  selectedUserIds: {
    type: Array,
    default: () => [],
  },
})

function initModel() {
  model.value = {
    app_code: null,
    process_code: null,
    role_code: null,
    status_code: null,
    access_allowed: true,
    ui_includes: [],
    ui_excludes: [],
    scope_codes: [],
    enabled: 'active',
    show_order: 0,
    ...(model.value || {}),
  }

  model.value.ui_includes = normalizeArray(model.value.ui_includes)
  model.value.ui_excludes = normalizeArray(model.value.ui_excludes)
  model.value.scope_codes = normalizeArray(model.value.scope_codes)
  
}

onMounted(() => {
  initModel()
})

const emit = defineEmits(['saved'])

const dataStore = useDataStore()
const saving = ref(false)
const loadingProcesses = ref(false)
const loadingUiItems = ref(false)

const processes = ref([])
const uiItems = ref([])

const apps = computed(() => dataStore.formMasters?.apps || [])
const roles = computed(() => dataStore.formMasters?.roles || [])
const scopeWords = computed(() => dataStore.formMasters?.key_words || [])

const statusItems = [
  { label: '指定なし', value: null },
  { label: '下書き', value: 'draft' },
  { label: '提出済', value: 'submitted' },
  { label: '承認済', value: 'approved' },
  { label: '終了', value: 'closed' },
]

const enabledItems = [
  { label: '有効', value: 'active' },
  { label: '無効', value: 'inactive' },
]

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

function updateField(key, value) {
  model.value = {
    ...(model.value || {}),
    [key]: value,
  }
}


function resetPermissionDetails() {
  model.value = {
    ...(model.value || {}),

    view_includes: [],
    view_excludes: [],

    edit_includes: [],
    edit_excludes: [],

    scope_codes: [],
  }
}

function updatePair(
  targetKey,
  otherKey,
  value
) {
  const targetValues = normalizeArray(value)

  const otherValues =
    normalizeArray(model.value?.[otherKey])
      .filter(
        x => !targetValues.includes(x)
      )

  model.value = {
    ...(model.value || {}),
    [targetKey]: targetValues,
    [otherKey]: otherValues,
  }
}

const viewIncludeItems = computed(() => {
  const excludes =
    normalizeArray(model.value?.view_excludes)

  return uiItems.value.filter(
    item => !excludes.includes(item.value)
  )
})

const viewExcludeItems = computed(() => {
  const includes =
    normalizeArray(model.value?.view_includes)

  return uiItems.value.filter(
    item => !includes.includes(item.value)
  )
})

const editIncludeItems = computed(() => {
  const excludes =
    normalizeArray(model.value?.edit_excludes)

  return uiItems.value.filter(
    item => !excludes.includes(item.value)
  )
})

const editExcludeItems = computed(() => {
  const includes =
    normalizeArray(model.value?.edit_includes)

  return uiItems.value.filter(
    item => !includes.includes(item.value)
  )
})

async function loadProcesses(appCode) {
  processes.value = []

  if (!appCode) return

  loadingProcesses.value = true

  try {
    const result = await dataStore.runLoad(
      'masters.get_app_item_category',
      {
        SQLTAG: 'masters.get_app_item_category',
        category_code: appCode,
        enabled: 'active',
      },
      'processes'
    )
    processes.value = result ||[]

  } finally {
    loadingProcesses.value = false
  }
}

async function loadUiItems(appCode, processCode) {
  uiItems.value = []

  if (!appCode || !processCode) return

  loadingUiItems.value = true

  try {
    const result = await dataStore.runLoad(
      'masters.get_item_dictionary',
      {
        SQLTAG: 'masters.get_item_dictionary',
        category_code: appCode,
        sub_category_code: processCode,
        enabled: 'active',
      },
      'dictionary'
    )

    const rows = Array.isArray(result)
      ? result
      : result?.dictionary?.result ||
        result?.result ||
        result?.data?.dictionary ||
        result?.data ||
        []

    const fields = Array.isArray(rows)
      ? rows
          .filter(row => row?.enabled !== 'inactive')
          .filter(row => row?.showable !== 'hide')
          .map(row => {
            const def =
              typeof row.field_definition === 'string'
                ? JSON.parse(row.field_definition || '{}')
                : row.field_definition || {}

            const itemCode = row.l_item_code || row.g_item_code

            return {
              label: def.label || row.item_description?.label || itemCode,
              value: itemCode,
              raw: row,
            }
          })
      : []

    const buttons = [
      { label: '保存ボタン', value: 'btn_save' },
      { label: '追加ボタン', value: 'btn_add' },
      { label: '削除ボタン', value: 'btn_delete' },
      { label: '申請ボタン', value: 'btn_submit' },
      { label: '承認ボタン', value: 'btn_approve' },
      { label: '却下ボタン', value: 'btn_reject' },
    ]

    uiItems.value = [...fields, ...buttons]
  } finally {
    loadingUiItems.value = false
  }
}


const includeItems = computed(() => {
  const excludes = normalizeArray(model.value?.ui_excludes)
  return uiItems.value.filter(item => !excludes.includes(item.value))
})

const excludeItems = computed(() => {
  const includes = normalizeArray(model.value?.ui_includes)
  return uiItems.value.filter(item => !includes.includes(item.value))
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
  () => model.value?.app_code,
  async appCode => {
    await loadProcesses(appCode)
    await loadUiItems(appCode)
  },
  { immediate: true }
)

const lastUiLoadKey = ref('')

watch(
  () => [model.value?.app_code, model.value?.process_code],
  async ([appCode, processCode]) => {
    const key = `${appCode || ''}:${processCode || ''}`

    if (!appCode || !processCode) {
      uiItems.value = []
      lastUiLoadKey.value = ''
      return
    }

    if (lastUiLoadKey.value === key) return

    lastUiLoadKey.value = key
    await loadUiItems(appCode, processCode)
  },
  { immediate: true }
)

watch(
  () => model.value?.access_allowed,
  value => {
    if (value === false) {
      resetPermissionDetails()
    }
  }
)


const saveSqltag = computed(() => {
  return (
    props.tabConfig?.sqltags?.save ||
    props.tabConfig?.save ||
    props.tabConfig?.sqltag_save ||
    null
  )
})

const canSave = computed(() => {
  return !!saveSqltag.value &&
    !!model.value?.app_code &&
    !!model.value?.process_code &&
    !!model.value?.role_code
})

async function save() {
  saving.value = true

  try {
    const payload = {
      ...model.value,
      ui_includes: normalizeArray(model.value.ui_includes),
      ui_excludes: normalizeArray(model.value.ui_excludes),
      scope_codes: normalizeArray(model.value.scope_codes),
    }

    const result = await dataStore.runSave(
      saveSqltag.value,
      payload,
      props.commonParams
    )

    emit('saved', result)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-card variant="outlined" class="pa-4">
    <v-card-title class="text-h6">
      アプリへの権限
    </v-card-title>

    <v-card-text>
      <v-row dense>
        <v-col cols="12" md="3">
          <v-select
            :model-value="model.app_code"
            label="アプリ"
            :items="apps"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="comfortable"
            clearable
            @update:model-value="updateField('app_code', $event)"
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            :model-value="model.process_code"
            label="機能"
            :items="processes"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="comfortable"
            clearable
            :loading="loadingProcesses"
            :disabled="!model.app_code"
            @update:model-value="updateField('process_code', $event)"
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            :model-value="model.role_code"
            label="ロール"
            :items="roles"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="comfortable"
            clearable
            @update:model-value="updateField('role_code', $event)"
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            :model-value="model.status_code"
            label="ワークフローステータス"
            :items="statusItems"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="comfortable"
            clearable
            @update:model-value="updateField('status_code', $event)"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-switch
            :model-value="model.access_allowed"
            label="アクセス許可"
            color="success"
            inset
            hide-details
            @update:model-value="updateField('access_allowed', $event)"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            :model-value="model.enabled"
            label="有効状態"
            :items="enabledItems"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="comfortable"
            @update:model-value="updateField('enabled', $event)"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            :model-value="model.show_order"
            label="表示順"
            type="number"
            variant="outlined"
            density="comfortable"
            @update:model-value="updateField('show_order', Number($event || 0))"
          />
        </v-col>
      </v-row>

      <v-alert
        v-if="model.access_allowed === false"
        type="warning"
        variant="tonal"
        class="my-4"
      >
        アクセス不可のため、UI項目権限とデータアクセス範囲は設定できません。
      </v-alert>

      <template v-else>
        <v-card variant="outlined" class="pa-3 my-4">
          <div class="text-subtitle-1 font-weight-bold mb-3">
            閲覧権限
          </div>

          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                :model-value="model.view_includes"
                label="閲覧許可項目"
                :items="viewIncludeItems"
                multiple
                chips
                closable-chips
                clearable
                item-title="label"
                item-value="value"
                @update:model-value="
                  updatePair(
                    'view_includes',
                    'view_excludes',
                    $event
                  )
                "
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                :model-value="model.view_excludes"
                label="閲覧禁止項目"
                :items="viewExcludeItems"
                multiple
                chips
                closable-chips
                clearable
                item-title="label"
                item-value="value"
                @update:model-value="
                  updatePair(
                    'view_excludes',
                    'view_includes',
                    $event
                  )
                "
              />
            </v-col>
          </v-row>
        </v-card>

        <v-card variant="outlined" class="pa-3 my-4">
          <div class="text-subtitle-1 font-weight-bold mb-3">
            編集権限
          </div>

          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                :model-value="model.edit_includes"
                label="編集許可項目"
                :items="editIncludeItems"
                multiple
                chips
                closable-chips
                clearable
                item-title="label"
                item-value="value"
                @update:model-value="
                  updatePair(
                    'edit_includes',
                    'edit_excludes',
                    $event
                  )
                "
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                :model-value="model.edit_excludes"
                label="編集禁止項目"
                :items="editExcludeItems"
                multiple
                chips
                closable-chips
                clearable
                item-title="label"
                item-value="value"
                @update:model-value="
                  updatePair(
                    'edit_excludes',
                    'edit_includes',
                    $event
                  )
                "
              />
            </v-col>
          </v-row>
        </v-card>

        <v-card variant="outlined" class="pa-3 my-4">
          <div class="text-subtitle-1 font-weight-bold mb-3">
            データアクセス範囲
          </div>

          <v-select
            :model-value="model.scope_codes"
            label="データスコープ"
            :items="scopeWords"
            item-title="label"
            item-value="value"
            multiple
            chips
            closable-chips
            clearable
            variant="outlined"
            density="comfortable"
            @update:model-value="updateField('scope_codes', normalizeArray($event))"
          />
        </v-card>
      </template>
    </v-card-text>

    <v-card-actions class="justify-end">
    <v-btn
      color="primary"
      :loading="saving"
      :disabled="!canSave"
      @click="save"
    >
      保存
    </v-btn>
    </v-card-actions>
  </v-card>
</template>

