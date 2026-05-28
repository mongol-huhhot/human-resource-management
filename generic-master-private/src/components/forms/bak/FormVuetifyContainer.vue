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
const activeName = ref('all')
const category = ref([])
const dictionary = ref([])

const tabSqlTags = computed(() => configStore.MAIN_CONFIG?.tab2sqltag_list || {})

onMounted(async () => {
  const multiQueryResult = await dataStore.dbAccessWithMultiTags({
    category: {
      SQLTAG: 'masters.get_item_category',
      category_code: 'staffs',
      enabled: 'active',
    },
    dictionary: {
      SQLTAG: 'masters.get_item_dictionary',
      category_code: 'staffs',
      enabled: 'active',
    },
  })

  if (multiQueryResult.code !== 0) {
    console.error('Failed to load data:', multiQueryResult.message)
    return
  }

  category.value = multiQueryResult.data.category
  dictionary.value = parseJsonbFields(
    multiQueryResult.data.dictionary,
    ['field_definition']
  )
})

const tabItems = computed(() => {
  return [
    {
      sub_category_code: 'all',
      category_name: '全項目'
    },
    ...(Array.isArray(category.value) ? category.value : [])
  ]
})

function getItemsByTab(tabCode) {
  if (!Array.isArray(dictionary.value)) return []

  if (tabCode === 'all') {
    return dictionary.value
  }

  return dictionary.value.filter(item => item.sub_category_code === tabCode)
}

function normalItems(tabCode) {
  return getItemsByTab(tabCode).filter(item => item.data_structure !== 'repeatable')
}

function repeatableItems(tabCode) {
  console.log('get repeatable items for tab:', tabCode, getItemsByTab(tabCode))
  return getItemsByTab(tabCode).filter(item => item.data_structure === 'repeatable')
}

const loadedTabs = ref({})
const loadingTabs = ref({})

function getStaffKey(row) {
  return row?.staff_id || row?.staff_code || null
}

function getRealTabCodes(tabCode) {
  if (tabCode === 'all') {
    return category.value.map(cat => cat.sub_category_code)
  }
  return [tabCode]
}

function ensureTabFormData(tabCode) {
  if (!formData.value[tabCode]) {
    formData.value[tabCode] = {}
  }
}

function initializeAllTabContainers() {
  category.value.forEach(cat => {
    ensureTabFormData(cat.sub_category_code)
  })
}

function initializeRepeatableFields(tabCode) {
  ensureTabFormData(tabCode)

  repeatableItems(tabCode).forEach(item => {
    if (!Array.isArray(formData.value[tabCode][item.key])) {
      formData.value[tabCode][item.key] = []
    }
  })
}

function parseTabRows(tabCode, rows = []) {
  const jsonbFields = tabSqlTags.value[tabCode]?.jsonb_fields || []
  const parsed = parseAndFlattenJsonbFields(rows, jsonbFields)
  return Array.isArray(parsed) ? (parsed[0] || {}) : {}
}

// activeになったタブだけスタッフデータをロードする
const loadActiveTabData = async (tabCode = activeName.value, options = {}) => {
  const row = dataStore.states.currentRow
  const staffKey = getStaffKey(row)

  if (!staffKey || !tabCode || !category.value?.length) return

  const targetTabCodes = getRealTabCodes(tabCode)
  const conditions = {}

  targetTabCodes.forEach(code => {
    const cacheKey = `${staffKey}:${code}`

    if (!options.force && loadedTabs.value[code] === cacheKey) {
      return
    }

    conditions[code] = {
      SQLTAG: tabSqlTags.value[code]?.sqltag || 'staffs.get_staff_data',
      category_code: code,
      staff_code: row?.staff_code || null,
      staff_id: row?.staff_id || null,
    }
  })

  if (!Object.keys(conditions).length) return

  loadingTabs.value[tabCode] = true

  const multiQueryResult = await dataStore.dbAccessWithMultiTags(conditions)

  loadingTabs.value[tabCode] = false

  if (multiQueryResult.code !== 0) {
    console.error('Failed to load tab data:', multiQueryResult.message)
    return
  }

  Object.keys(conditions).forEach(code => {
    const rows = multiQueryResult.data?.[code] || []

    formData.value[code] = {
      ...formData.value[code],
      ...parseTabRows(code, rows),
    }

    initializeRepeatableFields(code)
    loadedTabs.value[code] = `${staffKey}:${code}`

    console.log(`Loaded tab data: ${code}`, formData.value[code])
  })
}

watch(
  () => dataStore.states.currentRow,
  async (newVal) => {
    formData.value = {}
    loadedTabs.value = {}
    loadingTabs.value = {}
    initializeAllTabContainers()

    if (newVal) {
      await loadActiveTabData(activeName.value)
    }
  },
  { immediate: true }
)

watch(
  activeName,
  async (newTab) => {
    if (newTab) {
      await loadActiveTabData(newTab)
    }
  }
)

watch(
  category,
  async (newCategory) => {
    if (!newCategory?.length) return

    initializeAllTabContainers()

    // 初期表示は「全項目」ではなく、最初の実タブにすることで不要な一括ロードを避ける
    if (!activeName.value || activeName.value === 'all') {
      activeName.value = newCategory[0]?.sub_category_code || 'all'
      return
    }

    await loadActiveTabData(activeName.value)
  }
)

const editMode = computed(() => {
  return !!dataStore.states.currentRow
})

async function save() {
  console.log('save data:', formData.value)

  // 例
  // dataStore.save_staff({
  //   staff_code: dataStore.states.currentRow.staff_code,
  //   data: formData.value
  // })
}

async function csvDownload() {
  // CSV出力
}

async function confirmDelete() {
  if (confirm('データを削除してもよろしいですか？')) {
    // 削除処理
  }
}
</script>

<template>
  <!-- {{ formData }} -->
  <v-card class="container-card" variant="outlined">
    <v-card-title class="card-header">
      <div class="header-left truncated">
        <span v-if="dataStore.states?.currentRow" class="staff-title">
          {{ dataStore.states.currentRow.staff_code }} -
          {{ dataStore.states.currentRow.staff_name }}様
        </span>
      </div>

      <div class="header-actions">
        <template v-if="editMode">
          <v-btn color="primary" @click="save">
            保存
          </v-btn>

          <v-btn
            color="error"
            prepend-icon="mdi-close-circle"
            @click="confirmDelete"
          >
            データ削除
          </v-btn>
        </template>

        <v-btn
          color="success"
          size="small"
          icon="mdi-download"
          @click="csvDownload"
        />
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

          <template v-if="tab.sub_category_code === 'all'">
            <v-card
              v-for="cat in category"
              :key="cat.sub_category_code"
              class="mb-4"
              variant="outlined"
            >
              <v-card-title class="text-subtitle-1">
                {{ cat.category_name }}
              </v-card-title>

              <v-card-text>
                <DynamicVuetifyForm
                  v-model="formData[cat.sub_category_code]"
                  :fields="normalItems(cat.sub_category_code)"
                />
                <RepeatableFormWrapper
                  v-for="item in repeatableItems(cat.sub_category_code)"
                  :key="item.key"
                  v-model="formData[cat.sub_category_code][item.key]"
                  :label="item.label"
                  :children="item.children"
                  :add-button-text="item.props?.addButtonText"
                  class="mt-4"
                />
              </v-card-text>
            </v-card>
          </template>

          <template v-else>
            <DynamicVuetifyForm
              v-model="formData[tab.sub_category_code]"
              :fields="normalItems(tab.sub_category_code)"
            />

            <RepeatableFormWrapper
              v-for="item in repeatableItems(tab.sub_category_code)"
              :key="item.key"
              v-model="formData[tab.sub_category_code][item.key]"
              :label="item.label"
              :children="item.children"
              :add-button-text="item.props?.addButtonText"
              class="mt-4"
            />
          </template>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<style scoped>

.container-card {
  height: 100%;
  margin: 12px;
  background-color: #fff;
  border-radius: 8px;
  border: 0px solid #e0e0e0;
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
