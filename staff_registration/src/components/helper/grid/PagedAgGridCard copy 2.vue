<script setup>
import { computed, ref } from 'vue'
import AgGridPro from './AgGridPro.vue'

const props = defineProps({
  title: { type: String, default: '' },
  columns: { type: Array, default: () => [] },
  rowData: { type: Array, default: () => [] },
  gridHeight: { type: String, default: '600px' },
  page: { type: Number, default: 0 },
  pageSize: { type: Number, default: 100 },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits([
  'page-change',
  'page-size-change',
  'prev-page',
  'next-page',
])

const agGridHandler = ref(null)

const displayPage = computed(() => props.page + 1)

const totalRows = computed(() => props.rowData?.length || 0)

const filteredCount = computed(() => {
  return agGridHandler.value?.filteredCount || 0
})

const pageSizeItems = [
  { title: '20件', value: 20 },
  { title: '50件', value: 50 },
  { title: '100件', value: 100 },
  { title: '500件', value: 500 },
  { title: '1000件', value: 1000 },
]

const handlePrev = () => {
  emit('prev-page')
}

const handleNext = () => {
  emit('next-page')
}

const handlePageSizeChange = (val) => {
  emit('page-size-change', val)
}
</script>

<template>
  <v-card variant="flat" class="pa-0">
    <v-card-title>
      <div class="d-flex justify-space-between align-center ga-3 flex-wrap w-100">
        <b>{{ title }}</b>

        <div class="d-flex align-center ga-2 flex-wrap">
          <template v-if="totalRows">
            <span>
              総件数：
              {{ totalRows }}

              <span v-if="filteredCount">
                ({{ filteredCount }})
              </span>
            </span>

            <span
              v-if="agGridHandler?.selectedRowCount > 0"
            >
              選択数：
              {{ agGridHandler.selectedRowCount }}
            </span>
          </template>

          <template v-if="agGridHandler?.columnCount > 0">
            <span>
              合計列数：
              {{ agGridHandler.columnCount - 1 }}
            </span>

            <span
              v-if="agGridHandler?.visibleColumnCount > 0"
            >
              表示列数：
              {{ agGridHandler.visibleColumnCount - 2 }}
            </span>
          </template>

          <v-btn
            variant="outlined"
            :disabled="page <= 0 || loading"
            @click="handlePrev"
          >
            前へ
          </v-btn>

          <span>ページ {{ displayPage }}</span>

          <v-btn
            variant="outlined"
            :disabled="loading"
            @click="handleNext"
          >
            次へ
          </v-btn>

          <v-select
            :model-value="pageSize"
            :items="pageSizeItems"
            density="compact"
            variant="outlined"
            hide-details
            style="width: 120px;"
            @update:model-value="handlePageSizeChange"
          />
        </div>
      </div>
    </v-card-title>

    <v-card-text>
      <AgGridPro
        ref="agGridHandler"
        :columns="columns"
        :rowData="rowData"
        :height="gridHeight"
        :show_op="true"
      />
    </v-card-text>
  </v-card>
</template>
