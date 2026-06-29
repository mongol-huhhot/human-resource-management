<!-- FormVuetifyContainerHybrid.vue -->
<script setup>
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useDataStore } from '@/stores/DataStore'
import { useAppConfigStore } from '@/stores/AppConfigStore'
import DynamicVuetifyForm from '@/components/forms/DynamicVuetifyForm.vue'
import RepeatableFormWrapper from '@/components/forms/RepeatableFormWrapper.vue'
import { parseJsonbFields, parseAndFlattenJsonbFields } from '@/composables/utilFactory'
import { mergeConditionParams } from '@/composables/formParamBuilder'

/****
 * Config 方針
 * 1) 新方式: MAIN_CONFIG.mode_steps + MAIN_CONFIG.group_settings
 * 2) 旧方式: MAIN_CONFIG.tab2sqltag_list + mtb_item_category も fallback として維持
 *
 * condition merge priority:
 *   group_settings.[group_code].condition / tab2sqltag_list.[tab].condition
 *   + WebComponent property params
 *   + uiCondition
 *   + runTimeParams
 *   + optionParams
 */
const dataStore = useDataStore()
const configStore = useAppConfigStore()

configStore.loadFromWindow()

const props = defineProps({
  selectedRows: {
    type: Array,
    default: () => [],
  },
  selectedUserIds: {
    type: Array,
    default: () => [],
  },
})

const formData = ref({})
const activeName = ref('')
const category = ref([])
const dictionary = ref([])

const loadedTabs = ref({})
const loadingTabs = ref({})

const mainConfig = computed(() => configStore.MAIN_CONFIG || {})
const appKey = computed(() => mainConfig.value?.app_key || 'user_ownd_roles')

// Web Component properties: j='{"user_id":"401471","mode":"pre-join-register"}'
const propertyParams = computed(() => dataStore.params?.attributes || {})
const currentMode = computed(() => {
  return (
    propertyParams.value?.mode ||
    mainConfig.value?.mode ||
    mainConfig.value?.default_mode ||
    ''
  )
})

// 新方式 group_settings。旧方式 tab2sqltag_list も fallback として残す。
const groupSettings = computed(() => {
  return mainConfig.value?.group_settings || mainConfig.value?.tab2sqltag_list || {}
})

const modeSteps = computed(() => mainConfig.value?.mode_steps || {})

// need coding to collect following parameters
const uiCondition = ref({})
const runTimeParams = computed(() => dataStore.states.currentRow || {})
const optionParams = ref({})
const currentRow = computed(() => runTimeParams.value || {})

const isBulkMode = computed(() => props.selectedUserIds.length > 1)

const selectedUserText = computed(() => {
  if (isBulkMode.value) {
    return `${props.selectedUserIds.length}名選択中`
  }

  const groupConfig = getGroupConfig(activeName.value)
  const displayItems = groupConfig.display_items || ['user_id', 'user_name']

  const displayData = {
    ...propertyParams.value,
    ...runTimeParams.value,
    ...currentRow.value,
  }

  return buildDisplayText(displayData, displayItems) || mainConfig.value?.app_name || ''
})

function buildDisplayText(data = {}, items = []) {
  return items
    .map(key => data?.[key])
    .filter(v => v !== undefined && v !== null && v !== '')
    .join(' - ')
}

onMounted(async () => {
  await dataStore.loadFormMasters(appKey.value)

  category.value = normalizeCategoryRows(dataStore.formMasters?.category || [])

  dictionary.value = parseJsonbFields(
    dataStore.formMasters?.dictionary || [],
    ['field_definition', 'item_description', 'formula']
  )
})

/**
 * 表示タブ/ステップ
 * 新方式:
 *   mode_steps[currentMode] に定義された group_code の順番を使う。
 * 旧方式 fallback:
 *   mtb_item_category を使う。
 */
const tabItems = computed(() => {
  const steps = modeSteps.value?.[currentMode.value]

  if (Array.isArray(steps) && steps.length) {
    return steps
      .map((groupCode, index) => buildTabFromGroupCode(groupCode, index))
      .filter(Boolean)
  }

  return Array.isArray(category.value) ? category.value : []
})

function buildTabFromGroupCode(groupCode, index = 0) {
  const groupConfig = getGroupConfig(groupCode)
  const oldCategory = getCategoryByTab(groupCode)

  if (!groupConfig && !oldCategory) return null

  return {
    ...(oldCategory || {}),
    ...groupConfig,
    group_code: groupCode,
    sub_category_code: groupCode,
    sub_category_name: groupConfig?.label || oldCategory?.sub_category_name,
    category_name: groupConfig?.label || oldCategory?.category_name,
    show_order: groupConfig?.show_order ?? oldCategory?.show_order ?? index + 1,
    enabled: groupConfig?.enabled || oldCategory?.enabled || 'active',
    data_structure: getGroupDataStructure(groupCode, groupConfig, oldCategory),
    ui_component: groupConfig?.component || groupConfig?.ui_component || oldCategory?.ui_component,
  }
}

function normalizeCategoryRows(rows = []) {
  return rows
    .filter(row => row?.enabled !== 'inactive')
    .sort((a, b) => Number(a.show_order || 0) - Number(b.show_order || 0))
}

function getCategoryByTab(tabCode) {
  return category.value.find(cat => cat.sub_category_code === tabCode || cat.group_code === tabCode)
}

function getGroupConfig(tabCode) {
  return groupSettings.value?.[tabCode] || {}
}

function getTabTitle(tab) {
  return tab?.label || tab?.sub_category_name || tab?.category_name || tab?.group_code || tab?.sub_category_code || ''
}

function getTabCode(tab) {
  return tab?.group_code || tab?.sub_category_code || ''
}

/**
 * data_structure は config を優先。
 * mtb_item_category 廃止後も動くようにしつつ、旧 category がある場合は旧定義を活かす。
 * NOTE: 新 config では repeatable/page/files/single を group_settings 側に明示するのが最も安全。
 */
function getGroupDataStructure(tabCode, groupConfig = getGroupConfig(tabCode), oldCategory = getCategoryByTab(tabCode)) {
  if (groupConfig?.data_structure) return groupConfig.data_structure
  if (groupConfig?.structure) return groupConfig.structure
  if (groupConfig?.type) return groupConfig.type
  if (oldCategory?.data_structure) return oldCategory.data_structure

  // 現在の staff 系 config の最低限 fallback。将来は group_settings.data_structure 明示推奨。
  if (['bank', 'traffic', 'dependents', 'work_history', 'certification'].includes(tabCode)) {
    return 'repeatable'
  }
  if (tabCode === 'files') return 'files'
  if (['confirm', 'history'].includes(tabCode)) return 'page'

  return 'single'
}

function isRepeatableCategory(tabCode) {
  return getGroupDataStructure(tabCode) === 'repeatable'
}

function isPageCategory(tabCode) {
  return getGroupDataStructure(tabCode) === 'page'
}

function isFilesCategory(tabCode) {
  return getGroupDataStructure(tabCode) === 'files'
}

/**
 * 専用画面を取得する。
 * 新方式:
 *   group_settings.[group_code].component = 'ConfirmPreview'
 * 旧方式:
 *   mtb_item_category.ui_component = 'AppRolePermissionPage'
 */
const pageModules = import.meta.glob('/src/components/forms/pages/*.vue')
const pageComponentCache = {}

function getPageComponent(tabCode) {
  if (pageComponentCache[tabCode]) {
    return pageComponentCache[tabCode]
  }

  const groupConfig = getGroupConfig(tabCode)
  const cat = getCategoryByTab(tabCode)
  const componentName = groupConfig?.component || groupConfig?.ui_component || cat?.ui_component

  if (!componentName) return null

  const path = `/src/components/forms/pages/${componentName}.vue`
  const loader = pageModules[path]

  if (!loader) {
    console.error('Page component not found:', path, pageModules)
    return null
  }

  pageComponentCache[tabCode] = defineAsyncComponent(loader)
  return pageComponentCache[tabCode]
}

function normalizeDictionaryItem(item) {
  const definition = item.field_definition || {}

  return {
    ...item,
    ...definition,

    key: definition.key || item.l_item_code || item.g_item_code,
    name: definition.name || item.l_item_code || item.g_item_code,
    label: definition.label || item.item_description?.label || item.l_item_code || item.g_item_code,

    component: definition.component || definition.ui_component || 'v-text-field',
    type: definition.type || definition.input_type || 'text',

    props: definition.props || {},
    validation: definition.validation || {},
    display: definition.display || {},

    placeholder: definition.placeholder,
    items: definition.items || [],
    options: definition.options || {},

    help: definition.help || '',
    dependsOn: definition.dependsOn || null,
    normalize: definition.normalize || {},

    masterKey: definition.masterKey,
    dictionaryKey: definition.dictionaryKey,

    required: definition.required ?? false,
    readonly: definition.readonly ?? false,
    hidden: definition.hidden ?? false,
  }
}

function getItemsByTab(tabCode) {
  if (!Array.isArray(dictionary.value)) return []

  return dictionary.value
    .filter(item => {
      // 新 dictionary: group_code
      // 旧 dictionary: sub_category_code
      return item.group_code === tabCode || item.sub_category_code === tabCode
    })
    .filter(item => item.enabled !== 'inactive')
    .filter(item => item.showable !== 'hide')
    .sort((a, b) => Number(a.show_order || 0) - Number(b.show_order || 0))
    .map(normalizeDictionaryItem)
}

function ensureTabFormData(tabCode) {
  if (!tabCode) return

  if (isRepeatableCategory(tabCode)) {
    if (!Array.isArray(formData.value[tabCode])) {
      formData.value[tabCode] = []
    }
    return
  }

  if (!formData.value[tabCode] || Array.isArray(formData.value[tabCode])) {
    formData.value[tabCode] = {}
  }
}

function initializeAllTabContainers() {
  tabItems.value.forEach(tab => {
    ensureTabFormData(getTabCode(tab))
  })
}

function getTabCondition(tabCode) {
  return getGroupConfig(tabCode)?.condition || {}
}

function parseTabRows(tabCode, rows = []) {
  const jsonbFields = getGroupConfig(tabCode)?.jsonb_fields || []
  const parsed = parseAndFlattenJsonbFields(rows, jsonbFields)

  if (isRepeatableCategory(tabCode)) {
    if (Array.isArray(parsed)) return parsed
    return parsed ? [parsed] : []
  }

  return Array.isArray(parsed) ? (parsed[0] || {}) : {}
}

const loadActiveTabData = async (tabCode = activeName.value, options = {}) => {
  if (!tabCode || !tabItems.value?.length) return

  ensureTabFormData(tabCode)

  if (isPageCategory(tabCode)) {
    loadedTabs.value[tabCode] = `page:${tabCode}`
    return
  }

  const groupConfig = getGroupConfig(tabCode)
  const selectTag = groupConfig?.sqltags?.select

  if (!selectTag) {
    loadedTabs.value[tabCode] = `no-select:${tabCode}`
    return
  }

  const mergedParams = mergeConditionParams({
    condition: getTabCondition(tabCode),
    propertyParams: propertyParams.value,
    uiCondition: uiCondition.value,
    runTimeParams: runTimeParams.value,
    optionParams: {
      ...optionParams.value,
      ...options,
    },
  })

  const queryParams = {
    [tabCode]: {
      SQLTAG: selectTag,
      // 新方式は group_code、旧 SQL 互換のため sub_category_code/category_code も渡す
      group_code: tabCode,
      sub_category_code: tabCode,
      category_code: appKey.value,
      mode: currentMode.value,
      ...mergedParams,
    },
  }

  loadingTabs.value[tabCode] = true

  try {
    const multiQueryResult = await dataStore.dbAccessWithMultiTags(queryParams)

    if (multiQueryResult.code !== 0) {
      console.error('Failed to load tab data:', multiQueryResult.message)
      return
    }

    const rows = multiQueryResult.data?.[tabCode] || []
    const parsedData = parseTabRows(tabCode, rows)

    if (isRepeatableCategory(tabCode)) {
      formData.value[tabCode] = Array.isArray(parsedData) ? parsedData : []
    } else {
      formData.value[tabCode] = {
        ...(formData.value[tabCode] || {}),
        ...(parsedData || {}),
      }
    }
  } finally {
    loadingTabs.value[tabCode] = false
  }
}

function handleSaved(tabCode, result) {
  loadedTabs.value[tabCode] = null

  if (activeName.value === tabCode) {
    loadActiveTabData(tabCode, { force: true })
  }
}

watch(
  () => dataStore.states.currentRow,
  async (newVal) => {
    formData.value = {}
    loadedTabs.value = {}
    loadingTabs.value = {}

    initializeAllTabContainers()

    if (newVal && activeName.value) {
      formData.value[activeName.value] = {
        ...(formData.value[activeName.value] || {}),
        ...newVal,
      }
    }
  },
  { immediate: true }
)

watch(
  activeName,
  async (newTab) => {
    if (newTab) {
      ensureTabFormData(newTab)
      await loadActiveTabData(newTab)
    }
  }
)

watch(
  [tabItems, currentMode],
  async ([newTabs]) => {
    if (!newTabs?.length) return

    initializeAllTabContainers()

    const currentExists = newTabs.some(tab => getTabCode(tab) === activeName.value)
    if (!activeName.value || !currentExists) {
      activeName.value = getTabCode(newTabs[0])
      return
    }

    await loadActiveTabData(activeName.value)
  },
  { immediate: true }
)
</script>

<template>
  <v-card class="container-card" variant="outlined">
    <v-card-title class="card-header">
      <div class="header-left truncated">
        <span class="staff-title">
          {{ selectedUserText }}
        </span>
        <span v-if="currentMode" class="mode-label">
          {{ currentMode }}
        </span>
      </div>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-2">
      <v-tabs
        v-model="activeName"
        density="compact"
        color="primary"
        show-arrows
      >
        <v-tab
          v-for="tab in tabItems"
          :key="getTabCode(tab)"
          :value="getTabCode(tab)"
        >
          {{ getTabTitle(tab) }}
        </v-tab>
      </v-tabs>

      <v-window v-model="activeName" class="mt-2">
        <v-window-item
          v-for="tab in tabItems"
          :key="getTabCode(tab)"
          :value="getTabCode(tab)"
        >
          <v-progress-linear
            v-if="loadingTabs[getTabCode(tab)]"
            indeterminate
            class="mb-3"
          />

          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">
              {{ getTabTitle(tab) }}
            </v-card-title>

            <v-card-text>
              <!-- 1. 完全専用画面 -->
              <component
                v-if="isPageCategory(getTabCode(tab)) && getPageComponent(getTabCode(tab))"
                :is="getPageComponent(getTabCode(tab))"
                v-model="formData[getTabCode(tab)]"
                :fields="getItemsByTab(getTabCode(tab))"
                :sqltags="groupSettings[getTabCode(tab)]?.sqltags"
                :tab-config="groupSettings[getTabCode(tab)] || {}"
                :property-params="propertyParams"
                :ui-condition="uiCondition"
                :run-time-params="runTimeParams"
                :option-params="optionParams"
                :mode="currentMode"
                @saved="handleSaved(getTabCode(tab), $event)"
                :selected-rows="props.selectedRows"
                :selected-user-ids="props.selectedUserIds"
              />

              <!-- page指定だが ui_component 未設定 -->
              <v-alert
                v-else-if="isPageCategory(getTabCode(tab))"
                type="warning"
                variant="tonal"
              >
                {{ getTabCode(tab) }} は page 指定ですが、
                group_settings.component / ui_component が設定されていません。
              </v-alert>

              <!-- files: 専用 component が未設定の場合は通常フォームとして fallback -->
              <DynamicVuetifyForm
                v-else-if="isFilesCategory(getTabCode(tab))"
                v-model="formData[getTabCode(tab)]"
                :fields="getItemsByTab(getTabCode(tab))"
                :sqltags="groupSettings[getTabCode(tab)]?.sqltags"
                :tab-config="groupSettings[getTabCode(tab)] || {}"
                :property-params="propertyParams"
                :ui-condition="uiCondition"
                :run-time-params="runTimeParams"
                :option-params="optionParams"
                :mode="currentMode"
                @saved="handleSaved(getTabCode(tab), $event)"
                :selected-rows="props.selectedRows"
                :selected-user-ids="props.selectedUserIds"
              />

              <!-- 2. repeatable -->
              <RepeatableFormWrapper
                v-else-if="isRepeatableCategory(getTabCode(tab))"
                v-model="formData[getTabCode(tab)]"
                :label="getTabTitle(tab)"
                :children="getItemsByTab(getTabCode(tab))"
                :add-button-text="`${getTabTitle(tab)}追加`"
                :sqltags="groupSettings[getTabCode(tab)]?.sqltags"
                :tab-config="groupSettings[getTabCode(tab)] || {}"
                :property-params="propertyParams"
                :ui-condition="uiCondition"
                :run-time-params="runTimeParams"
                :option-params="optionParams"
                :mode="currentMode"
                @saved="handleSaved(getTabCode(tab), $event)"
                :selected-rows="props.selectedRows"
                :selected-user-ids="props.selectedUserIds"
              />

              <!-- 3. single dictionary form -->
              <DynamicVuetifyForm
                v-else
                v-model="formData[getTabCode(tab)]"
                :fields="getItemsByTab(getTabCode(tab))"
                :sqltags="groupSettings[getTabCode(tab)]?.sqltags"
                :tab-config="groupSettings[getTabCode(tab)] || {}"
                :property-params="propertyParams"
                :ui-condition="uiCondition"
                :run-time-params="runTimeParams"
                :option-params="optionParams"
                :mode="currentMode"
                @saved="handleSaved(getTabCode(tab), $event)"
                :selected-rows="props.selectedRows"
                :selected-user-ids="props.selectedUserIds"
              />
            </v-card-text>
          </v-card>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.container-card {
  height: 100%;
  margin: 0;
  background-color: #fff;
  border-radius: 8px;
  border: 0 solid #e0e0e0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.staff-title {
  font-size: 1.25em;
  font-weight: bold;
}

.mode-label {
  margin-top: 2px;
  font-size: 0.75rem;
  color: #666;
}

.header-actions {
  display: flex;
  gap: 8px;
}
</style>


<!-- 
<DynamicVuetifyForm
  v-model="formData"
  :fields="fields"
  :current-data="currentData"
  :request-data="draftData"
  :three-stage="true"
/> 

currentData なし
requestData なし
  → 新規入力モード

currentData なし
requestData draft あり
  → 新規登録の下書き継続

currentData なし
requestData submitted あり
  → 初期登録の承認待ち

-->

