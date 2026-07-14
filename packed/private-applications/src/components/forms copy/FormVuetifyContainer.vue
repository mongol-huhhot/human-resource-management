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
const sqltagMap = computed(() => configStore.MAIN_CONFIG?.sqltagMap || {})

// const tabConfig = tab2sqltag_list[activeTab.value]

// const sqltag = sqltagMap[tabConfig.data_key]

// const request = {
//   SQLTAG: sqltag,
//   staff_id: selectedStaffId.value,
// }

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
  return getItemsByTab(tabCode).filter(item => item.type !== 'repeatable')
}

function repeatableItems(tabCode) {
  return getItemsByTab(tabCode).filter(item => item.type === 'repeatable')
}

// 選択されているスタッフのデータをロードしてフォームに反映する
const loadStaffData = async (row) => {
  let conditions = {}

  // 現在のカテゴリに基づいて必要なSQLTAGを設定
  // tabSqlTags.value[cat.sub_category_code]?.sqltagは、AppConfigStoreのMAIN_CONFIGに定義されたtab2sqltag_listから取得される想定
  category.value?.forEach(cat => {
    if( tabSqlTags.value[cat.sub_category_code]?.skip_reload ) {
      console.log(`Skipping reload for category ${cat.sub_category_code} due to skip_reload flag.`)
      return
    }
    console.log('Processing category:', cat, cat.sub_category_code, tabSqlTags.value[cat.sub_category_code]?.sqltag)
    conditions[cat.sub_category_code] = {
      SQLTAG: tabSqlTags.value[cat.sub_category_code]?.sqltag || 'staffs.get_staff_data',
      category_code: cat.sub_category_code,
      staff_code: row?.staff_code || null,
    }
  })

  // まとめて一括クエリを実行してデータを取得
  const multiQueryResult = await dataStore.dbAccessWithMultiTags({
    ...conditions
  })

  // エラーハンドリング。失敗してないか？
  if (multiQueryResult.code !== 0) {
    console.error('Failed to load data:', multiQueryResult.message)
    return
  }

  // jsonbフィールドを展開してフォームデータにセット
  // tabSqlTags.value[cat.sub_category_code]?.jsonb_fieldsは、AppConfigStoreのMAIN_CONFIGに定義されたtab2sqltag_listから取得される想定
  category.value?.forEach(cat => {
    const dataKey = cat.sub_category_code
    const data = multiQueryResult.data[dataKey] || []
    
    const parsed = parseAndFlattenJsonbFields( data, tabSqlTags.value[cat.sub_category_code]?.jsonb_fields || [] )
    formData.value[dataKey] = Array.isArray(parsed) ? (parsed[0] || {}) : {}
    console.log(`Loaded data for category ${dataKey}:`, formData.value[dataKey])
  })
}

watch(
  () => dataStore.states.currentRow,
  async (newVal) => {
    if (newVal) {

      // flatをやめる
      formData.value = {}

      await loadStaffData(dataStore.states.currentRow)

      // repeatable初期化
      for (const item of dictionary.value) {

        const categoryKey = item.sub_category_code

        if (!formData.value[categoryKey]) {
          formData.value[categoryKey] = {}
        }

        if (
          item.type === 'repeatable' &&
          !Array.isArray(formData.value[categoryKey][item.key])
        ) {
          formData.value[categoryKey][item.key] = []
        }
      }

    } else {
      formData.value = {}
    }
  },
  { immediate: true }
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
          <DynamicVuetifyForm
            v-model="formData"
            :items="normalItems(tab.sub_category_code)"
            :category="tab.sub_category_code"
            :fields="category.value?.find(c => c.sub_category_code === tab.sub_category_code)?.fields || []"
          />

          <RepeatableFormWrapper
            v-for="item in repeatableItems(tab.sub_category_code)"
            :key="item.key"
            v-model="formData[item.key]"
            :label="item.label"
            :children="item.children"
            :add-button-text="item.props?.addButtonText"
            class="mt-4"
          />
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
