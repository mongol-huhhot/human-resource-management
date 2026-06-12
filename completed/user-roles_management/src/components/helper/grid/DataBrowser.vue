<script setup>
import { ref, watch, computed } from 'vue'
import PagedAgGridCard from './PagedAgGridCard.vue'
import { useDataBrowserStore } from '@/stores/DataBrowserStore'
import { ElDatePicker, ElSelect, ElOption } from 'element-plus'

const agGridHandler = ref(null)

const props = defineProps({
  sql_tag: {
    type: String,
    requested: true,
  },
  conditions: {
    type: Object,
    default: ()=>{},
  },
  columns: {
    type: Array,
    requested: true,
  }
})

const dataStore = useDataBrowserStore()

const page = ref(0)
const pageSize = ref(600)

const data = ref([])
const loading = ref(false)

const currentSqlTag = computed(() => props.sql_tag)
const columns = computed(() => props.columns)

const fetchData = async () => {
  const p = {
    offset: page.value * pageSize.value,
    row_count: pageSize.value,
    ...props.conditions
  }
  
  loading.value = true
  try {
    await dataStore.getData(currentSqlTag.value, p)

    data.value = Array.isArray(dataStore.data?.[currentSqlTag.value])
      ? dataStore.data[currentSqlTag.value]
      : []
  } finally {
    loading.value = false
  }

  console.log('data.value==', data.value)
  console.log('columns==', columns.value)
}

watch(
  [
    () => props,
    () => currentSqlTag.value,
    () => page.value,
    () => pageSize.value,
  ],
  async () => {
    await fetchData()
  },
  { immediate: true, deep: true }
)

// // 検索条件が変わったら先頭ページへ戻す
// watch(
//   [() => dateRange.value, () => currentSqlTag.value],
//   () => {
//     page.value = 0
//   },
//   { deep: true }
// )

const handlePageChange = (newPage) => {
  page.value = Math.max(0, Number(newPage) || 0)
}

const handlePageSizeChange = (newSize) => {
  pageSize.value = Number(newSize) || 1000
  page.value = 0
}

const prevPage = () => {
  if (page.value > 0) page.value -= 1
}

const nextPage = () => {
  // 総件数がないので、とりあえず次へ進める
  // 必要なら「取得件数 < pageSize のとき next 無効」にできます
  page.value += 1
}

</script>

<template>
  <div>
    <div style="display: flex;">
      <el-select
        v-model="dataType"
        placeholder="データ種類選択"
        style="width: 240px; margin: 8px;"
      >
        <el-option
          v-for="el in configStore?.MAIN_CONFIG?.genre"
          :key="el.sql_tag"
          :label="el.label"
          :value="el.sql_tag"
        />
      </el-select>

      <!-- {{ dateRange }} -->
      <div style="width: 30em; margin: 8px;">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="〜"
          start-placeholder="期間開始"
          end-placeholder="期間終了"
          :format="dateFormat"
          :value-format="dateFormat"
        />
      </div>
      <a href="https://surupas.native365.net/jfsg230540/webcomponents/jfsg230540/chart-system/?k=history" 
          target="_blank"
          style="margin-top: 10px;"
        >
          操作手順・説明図はこちら
        </a>
    </div>

    <PagedAgGridCard
      v-if="columns.length"
      ref="agGridHandler"
      :columns="columns"
      :row-data="data"
      :loading="loading"
      gridHeight="650px"
      :page="page"
      :pageSize="pageSize"
      title="過去データ閲覧"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @prev-page="prevPage"
      @next-page="nextPage"
    />
  </div>
</template>

