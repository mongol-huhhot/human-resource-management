<!-- PagedAgGridCard.vue -->
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

  // AgGridPro から外へ中継する event
  'row-click',
  'grid-ready',
  'filtered-changed',
  'counts-changed',
  'delete-row',
  'selected-rows-change',
])

const agGridHandler = ref(null)

const displayPage = computed(() => props.page + 1)
const totalRows = computed(() => props.rowData?.length || 0)
const filteredCount = ref(0)
const selectedRowCount = ref(0)
const columnCount = ref(0)
const visibleColumnCount = ref(0)

const pageSizeItems = [
  { title: '20件', value: 20 },
  { title: '50件', value: 50 },
  { title: '100件', value: 100 },
  { title: '500件', value: 500 },
  { title: '1000件', value: 1000 },
]

function handleCountsChanged(payload) {
  selectedRowCount.value = payload?.selectedRowCount || 0
  columnCount.value = payload?.columnCount || 0
  visibleColumnCount.value = payload?.visibleColumnCount || 0

  emit('counts-changed', payload)
}

function handleFilteredChanged(list) {
  filteredCount.value = Array.isArray(list) ? list.length : 0
  emit('filtered-changed', list)
}

defineExpose({
  agGridHandler,
})
</script>

<template>
  <v-card variant="flat" class="pa-0">
    <v-card-title>
      <div class="d-flex justify-space-between align-center ga-3 flex-wrap w-100">
        <b>{{ title }}</b>

        <div class="d-flex align-center ga-2 flex-wrap">
          <template v-if="totalRows">
            <span>
              総件数：{{ totalRows }}
              <span v-if="filteredCount">
                ({{ filteredCount }})
              </span>
            </span>

            <span v-if="selectedRowCount > 0">
              選択数：{{ selectedRowCount }}
            </span>
          </template>

          <template v-if="columnCount > 0">
            <span>
              合計列数：{{ columnCount }}
            </span>

            <span v-if="visibleColumnCount > 0">
              表示列数：{{ visibleColumnCount }}
            </span>
          </template>

          <v-btn
            variant="outlined"
            :disabled="page <= 0 || loading"
            @click="emit('prev-page')"
          >
            前へ
          </v-btn>

          <span>ページ {{ displayPage }}</span>

          <v-btn
            variant="outlined"
            :disabled="loading"
            @click="emit('next-page')"
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
            @update:model-value="emit('page-size-change', $event)"
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
        @row-click="emit('row-click', $event)"
        @grid-ready="emit('grid-ready', $event)"
        @filtered-changed="handleFilteredChanged"
        @counts-changed="handleCountsChanged"
        @delete-row="emit('delete-row', $event)"
        @selected-rows-change="$emit('selected-rows-change', $event)"
      />
    </v-card-text>
  </v-card>
</template>
