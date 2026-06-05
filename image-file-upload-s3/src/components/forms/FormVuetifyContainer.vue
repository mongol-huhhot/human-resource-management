<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useDataStore } from '@/stores/DataStore'
import { useAppConfigStore } from '@/stores/AppConfigStore'
import DynamicVuetifyForm from '@/components/forms/DynamicVuetifyForm.vue'
import RepeatableFormWrapper from '@/components/forms/RepeatableFormWrapper.vue'
import { parseJsonbFields, parseAndFlattenJsonbFields } from '@/composables/utilFactory'

const dataStore = useDataStore()
const configStore = useAppConfigStore()

configStore.loadFromWindow()

const formData = ref({})
const activeName = ref('')
const category = ref([])
const dictionary = ref([])

const loadedTabs = ref({})
const loadingTabs = ref({})

const tabSqlTags = computed(() => configStore.MAIN_CONFIG?.tab2sqltag_list || {})

// タブデータをロードする際のカテゴリコード。必要に応じて動的に変更することも可能
const categoryCode = 'system' // 固定値。必要に応じて動的に変更することも可能

// onMounted(async () => {
//   const multiQueryResult = await dataStore.dbAccessWithMultiTags({
//     category: {
//       SQLTAG: 'masters.get_item_category',
//       category_code: categoryCode,
//       enabled: 'active',
//     },
//     dictionary: {
//       SQLTAG: 'masters.get_item_dictionary',
//       category_code: categoryCode,
//       enabled: 'active',
//     },
//     roles: {
//       SQLTAG: 'system.get_roles',
//       enabled: 'active',
//     },
//     apps: {
//       SQLTAG: 'system.get_apps',
//       enabled: 'active',
//     },
//   })

//   // console.log('Loaded multi-query data:', multiQueryResult)

//   if (multiQueryResult.code !== 0) {
//     console.error('Failed to load data:', multiQueryResult.message)
//     return
//   }

//   // console.log('Loaded category data:', multiQueryResult.data?.category)
//   category.value = normalizeCategoryRows(multiQueryResult.data?.category || [])

//   // console.log('Loaded dictionary data:', multiQueryResult.data?.dictionary)
//   dictionary.value = parseJsonbFields(
//     multiQueryResult.data?.dictionary || [],
//     ['field_definition', 'item_description', 'formula']
//   )
// })

// const dataStore = useDataStore()
onMounted(async () => {
  await dataStore.loadFormMasters(categoryCode)

  category.value = normalizeCategoryRows(dataStore.formMasters?.category || [])

  dictionary.value = parseJsonbFields(
    dataStore.formMasters?.dictionary || [],
    ['field_definition', 'item_description', 'formula']
  )
})

const tabItems = computed(() => {
  return Array.isArray(category.value) ? category.value : []
})

const editMode = computed(() => {
  return !!dataStore.states.currentRow
})

function normalizeCategoryRows(rows = []) {
  // console.log('Normalizing category rows:', rows)
  return rows
    .filter(row => row?.enabled !== 'inactive')
    .sort((a, b) => Number(a.show_order || 0) - Number(b.show_order || 0))
}

function getCategoryByTab(tabCode) {
  return category.value.find(cat => cat.sub_category_code === tabCode)
}

function isRepeatableCategory(tabCode) {
  return getCategoryByTab(tabCode)?.data_structure === 'repeatable'
}

function normalizeDictionaryItem(item) {
  const definition = item.field_definition || {}

  return {
    ...item,
    ...definition,

    // DynamicVuetifyForm が参照する標準キー
    key: definition.key || item.l_item_code || item.g_item_code,
    label: definition.label || item.item_name || item.l_item_code || item.g_item_code,
    component: definition.component || definition.ui_component,
    type: definition.type || definition.input_type,
    props: definition.props || {},
    validation: definition.validation || {},
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

function getStaffKey(row) {
  return row?.staff_id || row?.staff_code || row?.user_id || null
}

// function getStaffName(row) {
//   return row?.staff_name || row?.user_name || null
// }

const currentStaffRow = computed(() => {
  return dataStore.states?.currentRow || dataStore.params?.attributes || {}
})

const commonParams = computed(() => {
  const row = currentStaffRow.value || {}

  console.log('Computing commonParams with currentStaffRow:', row)

  return {
    user_id: row.user_id || null,
    user_name: row.user_name 
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

// activeになったタブだけスタッフデータをロードする
const loadActiveTabData = async (tabCode = activeName.value, options = {}) => {
  const row = currentStaffRow.value
  const staffKey = getStaffKey(row)

  if (!staffKey || !tabCode || !category.value?.length) return

  ensureTabFormData(tabCode)

  const cacheKey = `${staffKey}:${tabCode}`

  if (!options.force && loadedTabs.value[tabCode] === cacheKey) {
    return
  }

  const condition = {
    [tabCode]: {
      SQLTAG:
        tabSqlTags.value[tabCode]?.sqltags?.select ||
        tabSqlTags.value[tabCode]?.sqltag,
        category_code: tabCode,
        user_id: row.user_id || null,
        request_id: row.request_id || null,
      }
  }

  console.log(`Loading tab data: ${tabCode} with condition`, condition)

  loadingTabs.value[tabCode] = true

  const multiQueryResult = await dataStore.dbAccessWithMultiTags(condition)

  loadingTabs.value[tabCode] = false

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

  loadedTabs.value[tabCode] = cacheKey

  console.log(`Loaded tab data: ${tabCode}`, formData.value[tabCode])
}

watch(
  () => dataStore.states.currentRow,
  async (newVal) => {
    formData.value = {}
    loadedTabs.value = {}
    loadingTabs.value = {}

    initializeAllTabContainers()

    if (newVal && activeName.value) {
      await loadActiveTabData(activeName.value, { force: true })
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
        <span v-if="currentStaffRow" class="staff-title">
          {{ commonParams.user_id }} -
          {{ commonParams.user_name }} 様
        </span>
      </div>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-2">
      <v-tabs
        v-model="activeName"
        density="compact"
        color="primary"
      >
        <v-tab
          v-for="tab in tabItems"
          :key="tab.sub_category_code"
          :value="tab.sub_category_code"
        >
          {{ tab.category_name }}
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
              {{ tab.category_name }}
            </v-card-title>

            <v-card-text>
              <RepeatableFormWrapper
                v-if="tab.data_structure === 'repeatable'"
                v-model="formData[tab.sub_category_code]"
                :label="tab.category_name"
                :children="getItemsByTab(tab.sub_category_code)"
                :add-button-text="`${tab.category_name}追加`"
                :sqltags="tabSqlTags[tab.sub_category_code]?.sqltags"
                :tab-config="tabSqlTags[tab.sub_category_code] || {}"
                :common-params="commonParams"
              />

              <DynamicVuetifyForm
                v-else
                v-model="formData[tab.sub_category_code]"
                :fields="getItemsByTab(tab.sub_category_code)"
                :sqltags="tabSqlTags[tab.sub_category_code]?.sqltags"
                :tab-config="tabSqlTags[tab.sub_category_code] || {}"
                :common-params="commonParams"
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
  margin: 0px;
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