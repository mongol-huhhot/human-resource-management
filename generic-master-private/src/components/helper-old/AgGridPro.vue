<!-- AgGridPro.vue (ESLint fixed + v31+ friendly + reactive counts) -->
<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import { useStorage } from '@vueuse/core'

import HeaderMenuButton from './HeaderMenuButton.vue'
import DeleteRowButton from './DeleteRowButton.vue'
import ColumnSettingsDialog from './ColumnSettingsDialog.vue'
import QuickFilterDialog from './QuickFilterDialog.vue'
import { localeJP } from '@/components/helper/LocaleJP.js'
import Encoding from 'encoding-japanese'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

const emit = defineEmits([
  'row-click',
  'grid-ready',
  'filtered-changed',
  'counts-changed',
  'delete-row',   // when opMode=delete
  'op-changed',   // optional for future
])

const VISIBLE_COLUMNS = 'aggrid:columnVisibility'

const props = defineProps({
  rowData: { type: Array, default: () => [] },
  pinnedBottomRowData: { type: Array, default: () => [] },

  // external columns (optional); if empty => dynamic by first row
  columns: { type: Array, default: () => [] },

  height: { type: [Number, String], default: 730 },
  localeText: { type: Object, default: () => localeJP },

  columnPrefKey: { type: String, default: 'aggrid:columnVisibility' },
  quickFilterKey: { type: String, default: 'aggrid-quick-filter' },

  // ✅ if true -> show op in cells; if false -> show row numbers in cells
  show_op: { type: Boolean, default: false },

  // ✅ what op is (when show_op=true)
  opMode: { type: String, default: 'delete' }, // 'delete' | 'checkbox'

})

const gridApi = ref(null)
const gridColumnApi = ref(null)

const columnDialogOpen = ref(false)
const quickFilterOpen = ref(false)

/** ---------------------------------------------------------
 * Headers (dynamic fallback) - data columns only
 * --------------------------------------------------------- */
const headers = computed(() => {
  // 1) If external columns exist, use them
  if (Array.isArray(props.columns) && props.columns.length) return props.columns

  // 2) Build from first row
  const first = props.rowData?.[0]
  if (!first || typeof first !== 'object') return []

  const keys = Object.keys(first)
    .map(k => (typeof k === 'string' ? k.trim() : k))
    // ✅ remove empty / bad keys that create “blank columns”
    .filter(k =>
      k !== '' &&
      k !== null &&
      k !== undefined &&
      k !== 'undefined' &&
      k !== 'null' &&
      !String(k).startsWith('__') // avoid system keys
    )

  // ✅ remove duplicates (duplicate fields also cause weird columns)
  const uniqKeys = Array.from(new Set(keys.map(String)))

  return uniqKeys.map((key) => ({
    field: key,
    headerName: key,
  }))
})


function buildFilteredCsvText() {
  const api = gridApi.value
  if (!api) return ''

  const rows = []

  api.forEachNodeAfterFilter((node) => {
    if (node.data) rows.push(node.data)
  })

  if (!rows.length) return ''

  // 表示中カラムだけ出力
  const cols = api.getAllDisplayedColumns
    ? api.getAllDisplayedColumns().map(c => c.getColId()).filter(id => id !== '__menu__')
    : headers.value.map(c => c.field)

  const escapeCsv = (v) => {
    const s = String(v ?? '')
    return `"${s.replace(/"/g, '""')}"`
  }

  const csv = [
    cols.join(','),
    ...rows.map(row => cols.map(f => escapeCsv(row?.[f])).join(','))
  ].join('\r\n')

  return csv
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function exportFilteredCsv(encoding = 'utf-8') {
  const csv = buildFilteredCsvText()
  if (!csv) return

  const fileNameBase = 'filtered_rows'
  let blob
  let fileName

  if (encoding.toLowerCase() === 'shift-jis' || encoding.toLowerCase() === 'sjis') {
    const unicodeArray = Encoding.stringToCode(csv)
    const sjisArray = Encoding.convert(unicodeArray, {
      to: 'SJIS',
      from: 'UNICODE',
    })
    blob = new Blob([new Uint8Array(sjisArray)], { type: 'text/csv' })
    fileName = `${fileNameBase}_sjis.csv`
  } else {
    // UTF-8 with BOM → Excelで文字化けしにくい
    blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    fileName = `${fileNameBase}_utf8.csv`
  }

  downloadBlob(blob, fileName)
}

/** ---------------------------------------------------------
 * Visible columns map - ONLY data columns
 * --------------------------------------------------------- */
const columnStorageKey = computed(() => props.columnPrefKey || VISIBLE_COLUMNS)
const quickFilterStorageKey = computed(() => props.quickFilterKey || 'aggrid-quick-filter')
const visibleColsStore = useStorage(columnStorageKey.value, {})

function normalizeVisibleMap(cols, map) {
  const fields = (cols || []).filter(c => c?.field).map(c => c.field)
  const next = {}
  for (const f of fields) next[f] = map?.[f] !== false
  return next
}

const visibleMap = computed({
  get: () => (visibleColsStore.value && typeof visibleColsStore.value === 'object') ? visibleColsStore.value : {},
  set: (v) => { visibleColsStore.value = (v && typeof v === 'object') ? v : {} },
})

watch(
  () => headers.value,
  (cols) => {
    if (!cols?.length) return
    visibleMap.value = normalizeVisibleMap(cols, visibleMap.value)
  },
  { immediate: true, deep: true }
)

function buildColumnStateFromMap(cols, map) {
  const fields = (cols || []).filter(c => c?.field).map(c => c.field)
  return fields.map(f => ({ colId: f, hide: map?.[f] === false }))
}

function applyColumnVisibility(map) {
  visibleMap.value = normalizeVisibleMap(headers.value, map)

  const api = gridApi.value
  const colApi = gridColumnApi.value
  if (!api) return

  const state = buildColumnStateFromMap(headers.value, visibleMap.value)

  if (typeof api.applyColumnState === 'function') {
    api.applyColumnState({ state, applyOrder: false })
  } else if (colApi?.applyColumnState) {
    colApi.applyColumnState({ state, applyOrder: false })
  } else if (colApi?.setColumnsVisible) {
    const show = state.filter(s => !s.hide).map(s => s.colId)
    const hide = state.filter(s => s.hide).map(s => s.colId)
    colApi.setColumnsVisible(show, true)
    colApi.setColumnsVisible(hide, false)
  }

  setTimeout(() => {
    refreshVisibleColumnCount()
    emitCounts()
    autoSizeAllColumns()
  }, 0)
}

/** ---------------------------------------------------------
 * Quick Filter
 * --------------------------------------------------------- */
const quickFilterText = useStorage(quickFilterStorageKey.value, '')

function applyQuickFilter(text) {
  quickFilterText.value = text || ''
  const api = gridApi.value
  if (!api) return

  if (typeof api.setGridOption === 'function') api.setGridOption('quickFilterText', quickFilterText.value)
  else if (typeof api.setQuickFilter === 'function') api.setQuickFilter(quickFilterText.value)

  setTimeout(() => captureFilteredData(), 0)
}
function clearQuickFilter() { applyQuickFilter('') }

/** ---------------------------------------------------------
 * ✅ Menu column header always shown
 * - show_op=true: cells = op (delete/checkbox)
 * - show_op=false: cells = row number
 * --------------------------------------------------------- */
// function rowNumberValueGetter(p) {
//   const idx = p?.node?.rowIndex
//   return (typeof idx === 'number' && idx >= 0) ? (idx + 1) : ''
// }

const menuOrOpColDef = computed(() => {
  const base = {
    headerName: '',
    field: '__menu__',       // ✅ ADD THIS
    colId: '__menu__',       // keep
    width: props.show_op ? 20 : 30,
    pinned: 'left',
    lockPinned: true,
    lockPosition: 'left',
    suppressMovable: true,
    suppressNavigable: true,
    suppressColumnsToolPanel: true,
    headerComponent: HeaderMenuButton,
    suppressHeaderMenuButton: true,
    sortable: false,
    filter: false,
    resizable: false,
  }

  if (!props.show_op) {
    return {
      ...base,
      valueGetter: (p) => {
        const idx = p?.node?.rowIndex
        return typeof idx === 'number' && idx >= 0 ? idx + 1 : ''
      },
      valueFormatter: (p) => String(p.value ?? ''),
    }
  }

  if (props.opMode === 'checkbox') {
    return {
      ...base,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
    }
  }

  return {
    ...base,
    cellRenderer: DeleteRowButton,
  }
})

/** ---------------------------------------------------------
 * Column defs
 * --------------------------------------------------------- */
const processedColumnDefs = computed(() => {
  const baseCols = (headers.value || []).map((col) => ({
    ...col,
    valueGetter: col.valueGetter
      ? col.valueGetter
      : (p) => (col.field ? (p.data?.[col.field] ?? '') : ''),
  }))

  return [menuOrOpColDef.value, ...baseCols]
})

/** ---------------------------------------------------------
 * Filtered capture
 * --------------------------------------------------------- */
function captureFilteredData() {
  const api = gridApi.value
  if (!api) {
    filteredRowCount.value = 0
    return
  }

  const list = []
  api.forEachNodeAfterFilter((node) => list.push(node.data))
  filteredRowCount.value = list.length
  emit('filtered-changed', list)
}

/** ---------------------------------------------------------
 * Autosize
 * --------------------------------------------------------- */
function autoSizeAllColumns() {
  const api = gridApi.value
  if (!api) return
  if (typeof api.autoSizeAllColumns === 'function') return api.autoSizeAllColumns(false)

  if (typeof api.getAllDisplayedColumns === 'function' && typeof api.autoSizeColumns === 'function') {
    const cols = api.getAllDisplayedColumns() || []
    const ids = cols.map(c => c.getColId())
    if (ids.length) api.autoSizeColumns(ids, false)
  }
}

/** ---------------------------------------------------------
 * Counts
 * --------------------------------------------------------- */
const dataRowCount = computed(() => props.rowData?.length || 0)
const columnCount = computed(() => (headers.value || []).filter(c => c?.field).length)
const selectedRowCount = ref(0)
const visibleColumnCount = ref(0)
const filteredRowCount = ref(0)

function refreshFilteredRowCount() {
  const api = gridApi.value
  if (!api) {
    filteredRowCount.value = 0
    return
  }

  let count = 0
  api.forEachNodeAfterFilter(() => {
    count += 1
  })
  filteredRowCount.value = count
}

function refreshSelectedRowCount() {
  const api = gridApi.value
  const rows = api?.getSelectedRows?.() || []
  selectedRowCount.value = Array.isArray(rows) ? rows.length : 0
}

function refreshVisibleColumnCount() {
  const api = gridApi.value
  if (!api) return (visibleColumnCount.value = 0)
  if (typeof api.getAllDisplayedColumns === 'function') {
    visibleColumnCount.value = (api.getAllDisplayedColumns() || []).length
    return
  }
  visibleColumnCount.value = 0
}

function emitCounts() {
  emit('counts-changed', {
    dataRowCount: dataRowCount.value,
    filteredRowCount: filteredRowCount.value,
    selectedRowCount: selectedRowCount.value,
    columnCount: columnCount.value,
    visibleColumnCount: visibleColumnCount.value,
  })
}

function refreshCounts() {
  refreshSelectedRowCount()
  refreshVisibleColumnCount()
  refreshFilteredRowCount()
  emitCounts()
}

// function exportFilteredCsv() {
//   const api = gridApi.value
//   if (!api) return

//   const rows = []

//   api.forEachNodeAfterFilter((node) => {
//     if (node.data) rows.push(node.data)
//   })

//   if (!rows.length) return

//   // columns（表示中のカラムだけ）
//   const cols = headers.value.map(c => c.field)

//   const csv = [
//     cols.join(','), // header
//     ...rows.map(row =>
//       cols.map(f => {
//         const v = row?.[f] ?? ''
//         // CSVエスケープ
//         return `"${String(v).replace(/"/g, '""')}"`
//       }).join(',')
//     )
//   ].join('\n')

//   const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
//   const url = URL.createObjectURL(blob)

//   const a = document.createElement('a')
//   a.href = url
//   a.download = 'filtered_rows.csv'
//   a.click()

//   URL.revokeObjectURL(url)
// }

/** ---------------------------------------------------------
 * Grid options
 * --------------------------------------------------------- */
const gridOptions = computed(() => ({
  rowSelection: 'multiple',
  suppressRowClickSelection: false,
  defaultColDef: {
    resizable: true,
    sortable: true,
    filter: true,
    flex: 1,
    minWidth: 120
  },
  localeText: props.localeText,

  context: {
    openColumnSettings: () => { columnDialogOpen.value = true },
    openQuickFilter: () => { quickFilterOpen.value = true },

    // DeleteRowButton should call: params.context.requestDelete(params)
    requestDelete: (p) => emit('delete-row', p.data),

    opChanged: (payload) => emit('op-changed', payload),

    // ✅ 追加
    exportFilteredCsv: () => exportFilteredCsv(),

    exportFilteredCsvUtf8: () => exportFilteredCsv('utf-8'),
    exportFilteredCsvSjis: () => exportFilteredCsv('shift-jis'),
  },
}))

function onGridReady(params) {
  gridApi.value = params.api
  gridColumnApi.value = params.columnApi

  params.api.addEventListener('filterChanged', () => {
    captureFilteredData()
    refreshCounts()
  })
  params.api.addEventListener('selectionChanged', () => {
    refreshSelectedRowCount()
    emitCounts()
  })
  params.api.addEventListener('columnVisible', () => {
    refreshVisibleColumnCount()
    emitCounts()
  })

  applyColumnVisibility(visibleMap.value)
  applyQuickFilter(quickFilterText.value)

  emit('grid-ready', { api: gridApi.value, columnApi: gridColumnApi.value })

  setTimeout(() => {
    autoSizeAllColumns()
    refreshCounts()
  }, 0)
}

function onRowClicked(event) {
  emit('row-click', event)
}

watch(
  () => props.rowData,
  async (v) => {
    await nextTick()
    gridApi.value?.doLayout?.()
    refreshCounts()
    if (v?.length) refreshLayout('fit')
  },
  { deep: true }
)

function refreshLayout(mode = 'fit') {
  const api = gridApi.value
  if (!api) return
  api.doLayout?.()
  if (mode === 'fit' && api.sizeColumnsToFit) {
    const w = api?.gridBodyCtrl?.eBodyViewport?.clientWidth
    if (w && w > 50) api.sizeColumnsToFit()
  } else if (mode === 'auto') {
    autoSizeAllColumns()
  }
}

defineExpose({
  gridApi,
  gridColumnApi,
  VISIBLE_COLUMNS,
  openQuickFilter: () => (quickFilterOpen.value = true),
  openColumnSettings: () => (columnDialogOpen.value = true),
  dataRowCount,
  filteredRowCount,
  selectedRowCount,
  columnCount,
  visibleColumnCount,
  refreshLayout,
})

const autoSizeStrategy = ref(undefined)
// const autoSizeStrategy = ref({ type: 'fitGridWidth' })
</script>

<template>
  <!-- {{ headers }} -->
  <ag-grid-vue
    class="ag-theme-alpine"
    :style="{ width: '100%', height: typeof height === 'number' ? height + 'px' : height }"
    :grid-options="gridOptions"
    :columnDefs="processedColumnDefs"
    :rowData="rowData"
    :pinnedBottomRowData="pinnedBottomRowData"
    @grid-ready="onGridReady"
    @row-clicked="onRowClicked"
    :autoSizeStrategy="autoSizeStrategy"
  />

  <QuickFilterDialog
    v-model:open="quickFilterOpen"
    :value="quickFilterText"
    @apply="applyQuickFilter"
    @clear="clearQuickFilter"
  />

  <ColumnSettingsDialog
    v-model:open="columnDialogOpen"
    :columns="headers"
    :visibleMap="visibleMap"
    @apply="applyColumnVisibility"
    :storageKey="VISIBLE_COLUMNS"
  />
  <!-- <ColumnSettingsDialog
    v-model:open="columnDialogOpen"
    :columns="columns"
    :visibleMap="visibleMap"
    @apply="applyColumnVisibility"
    :storageKey="VISIBLE_COLUMNS"
  /> -->
</template>
