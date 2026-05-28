<!-- PagedAgGridCard.vue -->
<!-- PagedAgGridCard.vue (Element Plus) -->
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AgGridPro from '@/components/helper/AgGridPro.vue'
import { ElCard, ElPagination, ElButton } from 'element-plus'

/**
 * ✅ Replace this with your Pinia store / API call.
 * Must return:
 *   { rows: Array, total: Number, columns?: Array }
 */
async function fetchPageFromDb({ page, pageSize, extraParams }) {
  // Example placeholder:
  // const res = await api.get('/dataEngine/v1/xxx', { params: { page, pageSize, ...extraParams } })
  // return { rows: res.data.rows, total: res.data.total, columns: res.data.columns }
  console.log('Fetching page from DB with params:', { page, pageSize, extraParams })
  return { rows: [], total: 0, columns: [] }
}

const props = defineProps({
  title: { type: String, default: 'List' },

  // optional fixed columns
  columns: { type: Array, default: () => [] },

  rowData: { type: Array, default: () => [] },

  // initial
  initialPage: { type: Number, default: 1 },
  initialPageSize: { type: Number, default: 50 },
  pageSizeOptions: { type: Array, default: () => [20, 50, 100, 200] },

  // optional extra params for DB query (filters, yearMonth, etc.)
  queryParams: { type: Object, default: () => ({}) },

  // grid
  gridHeight: { type: [Number, String], default: 'calc(100% - 0px)' },
  show_op: { type: Boolean, default: false },
  opMode: { type: String, default: 'delete' }, // if your AgGridPro supports it

  // if you want to auto load when mounted
  autoLoad: { type: Boolean, default: true },
})

const emit = defineEmits(['loaded', 'row-click', 'delete-row'])

const loading = ref(false)
const rows = ref([])
const total = ref(0)

// pagination state (Element Plus is 1-based)
const page = ref(props.initialPage)
const pageSize = ref(props.initialPageSize)

const pageCount = computed(() => Math.max(1, Math.ceil((total.value || 0) / (pageSize.value || 1))))

async function load() {
  loading.value = true
  try {
    const res = await fetchPageFromDb({
      page: page.value,
      pageSize: pageSize.value,
      extraParams: props.queryParams,
    })

    rows.value = res?.rows || []
    total.value = Number(res?.total || 0)

    emit('loaded', { page: page.value, pageSize: pageSize.value, total: total.value })
  } finally {
    loading.value = false
  }
}

// keep page in range when total changes
watch(pageCount, (pc) => {
  if (page.value > pc) page.value = pc
})

// reload when page/pageSize changes
watch([page, pageSize], () => load())

// reload when queryParams changes (filters etc.)
watch(
  () => props.queryParams,
  () => {
    page.value = 1
    load()
  },
  { deep: true }
)

onMounted(() => {
  if (props.autoLoad) load()
})

function onCurrentChange(p) {
  page.value = p
}
function onSizeChange(s) {
  pageSize.value = s
  page.value = 1
}

function onRowClick(e) {
  emit('row-click', e)
}
function onDeleteRow(row) {
  emit('delete-row', row)
}
</script>

<template>
  <el-card class="paged-card" shadow="never">
    <template #header>
      <div class="card-header">
        <div class="title">{{ title }}</div>

        <div class="right">
          <div class="total">Total: {{ total }}</div>

          <el-pagination
            background
            :current-page="page"
            :page-size="pageSize"
            :total="total"
            :page-sizes="pageSizeOptions"
            layout="sizes, prev, pager, next, jumper"
            :disabled="loading"
            @current-change="onCurrentChange"
            @size-change="onSizeChange"
          />

          <el-button size="small" :loading="loading" @click="load">
            Refresh
          </el-button>
        </div>
      </div>
    </template>

    <div class="grid-wrap">
      <AgGridPro
        :height="gridHeight"
        :row-data="rows"
        :columns="columns"
        :show_op="show_op"
        :opMode="opMode"
        @row-click="onRowClick"
        @delete-row="onDeleteRow"
      />
    </div>
  </el-card>
</template>

<style scoped>
.paged-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title {
  font-size: 14px;
  font-weight: 600;
}
.right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}
.total {
  font-size: 12px;
  opacity: 0.85;
}
.grid-wrap {
  height: calc(100% - 0px);
}
</style>