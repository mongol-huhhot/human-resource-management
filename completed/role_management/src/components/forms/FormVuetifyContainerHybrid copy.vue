<!-- FormVuetifyContainerHybrid.vue -->
<script setup>
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useDataStore } from '@/stores/DataStore'
import { useAppConfigStore } from '@/stores/AppConfigStore'
import DynamicVuetifyForm from '@/components/forms/DynamicVuetifyForm.vue'
import RepeatableFormWrapper from '@/components/forms/RepeatableFormWrapper.vue'
import { parseJsonbFields, parseAndFlattenJsonbFields, } from '@/composables/utilFactory'
import { mergeConditionParams, } from '@/composables/formParamBuilder'

/****
 * 1) config init conditoon values
 *   (1) MAIN_CONFIG.grid.condition
 *   (2) MAIN_CONFIG.tab2sqltag_list.[sub_category_code].condition
 * 2) properties of "custom web component", stored in
 *      dataStore.params.attributes
 * 3) アプリケーションの条件の値
 * 　{start_date: '2026-06-11', ....} // repared by programmer(need programming) 
 * 4) データ選択などでダイナミック値
 * 　例えば、selectedRow // dynamic values, collected by programmer(request a little coding) 
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

const tabSqlTags = computed(() => configStore.MAIN_CONFIG?.tab2sqltag_list || {})

const categoryCode = computed(() => configStore.MAIN_CONFIG?.app_key||'user_ownd_roles') // アプリケーション
// const selectSqlTag = computed(() => tabSqlTags.value?.[activeName.value]?.sqltags?.select)

const isBulkMode = computed(() => props.selectedUserIds.length > 1)

const selectedUserText = computed(() => {
  if (isBulkMode.value) {
    return `${props.selectedUserIds.length}名選択中`
  }

  return commonParams.value.user_id
    ? `${commonParams.value.user_id} - ${commonParams.value.user_name || ''} 様`
    : ''
})

onMounted(async () => {
  await dataStore.loadFormMasters(categoryCode.value)

  category.value = normalizeCategoryRows(dataStore.formMasters?.category || [])

  dictionary.value = parseJsonbFields(
    dataStore.formMasters?.dictionary || [],
    ['field_definition', 'item_description', 'formula']
  )

  console.log("dictionary.value===", dictionary.value)
})

const tabItems = computed(() => {
  return Array.isArray(category.value) ? category.value : []
})

// const editMode = computed(() => {
//   return !!dataStore.states.currentRow
// })

function normalizeCategoryRows(rows = []) {
  return rows
    .filter(row => row?.enabled !== 'inactive')
    .sort((a, b) => Number(a.show_order || 0) - Number(b.show_order || 0))
}

function getCategoryByTab(tabCode) {
  return category.value.find(cat => cat.sub_category_code === tabCode)
}

function getTabTitle(tab) {
  return tab?.sub_category_name || tab?.category_name || tab?.sub_category_code || ''
}

function isRepeatableCategory(tabCode) {
  return getCategoryByTab(tabCode)?.data_structure === 'repeatable'
}

function isPageCategory(tabCode) {
  return getCategoryByTab(tabCode)?.data_structure === 'page'
}

/**
 * 専用画面を取得する。
 *
 * DB:
 * mtb_item_category.ui_component = 'AppRolePermissionPage'
 *
 * ファイル:
 * src/pages/AppRolePermissionPage.vue
 */
const pageModules = import.meta.glob('/src/components/forms/pages/*.vue')

const pageComponentCache = {}

function getPageComponent(tabCode) {

  if (pageComponentCache[tabCode]) {
    return pageComponentCache[tabCode]
  }

  const cat = getCategoryByTab(tabCode)
  const componentName = cat?.ui_component

  if (!componentName) return null

  const path = `/src/components/forms/pages/${componentName}.vue`
  const loader = pageModules[path]

  console.log('componentName=', componentName)
  console.log('path=', path)
  console.log('loader=', loader)

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
    .filter(item => item.sub_category_code === tabCode)
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
  category.value.forEach(cat => {
    ensureTabFormData(cat.sub_category_code)
  })
}

// function getStaffKey(row) {
//   return row?.staff_id || row?.staff_code || row?.user_id || null
// }

const currentStaffRow = computed(() => {
  return dataStore.states?.currentRow || dataStore.params?.attributes || {}
})

const commonParams = computed(() => {
  const row = currentStaffRow.value || {}

  return {
    user_id: row.user_id || null,
    user_name: row.user_name || null,
    staff_id: row.staff_id || null,
    staff_code: row.staff_code || null,
    request_id: row.request_id || null,
  }
})

function parseTabRows(tabCode, rows = []) {
  const jsonbFields = tabSqlTags.value[tabCode]?.jsonb_fields || []
  const parsed = parseAndFlattenJsonbFields(rows, jsonbFields)

  if (isRepeatableCategory(tabCode)) {
    if (Array.isArray(parsed)) return parsed
    return parsed ? [parsed] : []
  }

  return Array.isArray(parsed) ? (parsed[0] || {}) : {}
}

// function tabNeedStaff(tabCode) {
//   const tabConfig = tabSqlTags.value[tabCode] || {}
//   const cat = getCategoryByTab(tabCode)

//   if (tabConfig.needStaff === false) return false
//   if (cat?.category_code === 'system') return false
//   if (isPageCategory(tabCode)) return false

//   return true
// }

const loadActiveTabData = async (tabCode = activeName.value, options = {}) => {
  if (!tabCode || !category.value?.length) return

  ensureTabFormData(tabCode)

  if (isPageCategory(tabCode)) {
    loadedTabs.value[tabCode] = `page:${tabCode}`
    return
  }

  const row = currentStaffRow.value
  // const staffKey = getStaffKey(row)

  // if (!staffKey && tabNeedStaff(tabCode)) return

  // const cacheKey = `${staffKey || 'no-staff'}:${tabCode}`

  // if (!options.force && loadedTabs.value[tabCode] === cacheKey) {
  //   return
  // }

  const selectTag =
    tabSqlTags.value[tabCode]?.sqltags?.select
    // tabSqlTags.value[tabCode]?.sqltag

  // if (!selectTag) {
  //   loadedTabs.value[tabCode] = cacheKey
  //   return
  // }

  const condition = {
    [tabCode]: {
      SQLTAG: selectTag,
      category_code: tabCode,
      ...options,
      ...commonParams.value,
    },
  }

  loadingTabs.value[tabCode] = true

  try {
    const multiQueryResult = await dataStore.dbAccessWithMultiTags(condition)

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

    // loadedTabs.value[tabCode] = cacheKey
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
   
    // console.log("dsadasdasdada===", newVal, activeName.value, tabSqlTags.value[activeName.value], sqltag)
    formData.value = {}
    loadedTabs.value = {}
    loadingTabs.value = {}

    initializeAllTabContainers()
    
    if (newVal && activeName.value) {
      await loadActiveTabData(activeName.value, { force: true, ...dataStore.states.currentRow })
      // console.log("sfdasfsdfsdfsdf99999999999999999999")
      // await loadActiveTabData(selectSqlTag.value, { force: true, ...dataStore.states.currentRow })
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
  category,
  async (newCategory) => {
    if (!newCategory?.length) return

    initializeAllTabContainers()

    if (!activeName.value) {
      activeName.value = newCategory[0]?.sub_category_code || ''
      return
    }

    await loadActiveTabData(activeName.value)
  }
)
</script>

<template>
  <v-card class="container-card" variant="outlined">
    <v-card-title class="card-header">
      <div class="header-left truncated">
        <span class="staff-title">
          {{ selectedUserText }}
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
          :key="tab.sub_category_code"
          :value="tab.sub_category_code"
        >
          {{ getTabTitle(tab) }}
        </v-tab>
      </v-tabs>

      <v-window v-model="activeName" class="mt-2">
        <v-window-item
          v-for="tab in tabItems"
          :key="tab.sub_category_code"
          :value="tab.sub_category_code"
        >
          <v-progress-linear
            v-if="loadingTabs[tab.sub_category_code]"
            indeterminate
            class="mb-3"
          />

          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">
              {{ getTabTitle(tab) }}
            </v-card-title>

              <!-- selectedRows
              selectedUserIds -->
            <v-card-text>
              <!-- 1. 完全専用画面 -->
              <component
                v-if="isPageCategory(tab.sub_category_code)"
                :is="getPageComponent(tab.sub_category_code)"
                v-model="formData[tab.sub_category_code]"
                :tab-code="tab.sub_category_code"
                :tab-info="tab"
                :tab-config="tabSqlTags[tab.sub_category_code] || {}"
                :common-params="commonParams"
                :current-row="currentStaffRow"
                :selected-rows="props.selectedRows"
                :selected-user-ids="props.selectedUserIds"
                @saved="handleSaved(tab.sub_category_code, $event)"
              />

              <!-- page指定だが ui_component 未設定 -->
              <v-alert
                v-else-if="isPageCategory(tab.sub_category_code)"
                type="warning"
                variant="tonal"
              >
                {{ tab.sub_category_code }} は page 指定ですが、
                mtb_item_category.ui_component が設定されていません。
              </v-alert>

              <!-- 2. repeatable -->
              <RepeatableFormWrapper
                v-else-if="tab.data_structure === 'repeatable'"
                v-model="formData[tab.sub_category_code]"
                :label="getTabTitle(tab)"
                :children="getItemsByTab(tab.sub_category_code)"
                :add-button-text="`${getTabTitle(tab)}追加`"
                :sqltags="tabSqlTags[tab.sub_category_code]?.sqltags"
                :tab-config="tabSqlTags[tab.sub_category_code] || {}"
                :common-params="commonParams"
                @saved="handleSaved(tab.sub_category_code, $event)"
                :selected-rows="props.selectedRows"
                :selected-user-ids="props.selectedUserIds"
              />

              <!-- 3. single dictionary form -->
              <DynamicVuetifyForm
                v-else
                v-model="formData[tab.sub_category_code]"
                :fields="getItemsByTab(tab.sub_category_code)"
                :sqltags="tabSqlTags[tab.sub_category_code]?.sqltags"
                :tab-config="tabSqlTags[tab.sub_category_code] || {}"
                :common-params="commonParams"
                @saved="handleSaved(tab.sub_category_code, $event)"
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

.header-actions {
  display: flex;
  gap: 8px;
}
</style>