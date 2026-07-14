<script setup>
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon, ElMessage } from 'element-plus'
import { MoreFilled } from '@element-plus/icons-vue'
import { onMounted, ref,  } from 'vue'

const props = defineProps({ params: Object })

// const params = inject('agGridParams') // or props.params

const api = ref(null)
const columnApi = ref(null)

// exclude internal columns if needed
const EXCLUDE_COL_IDS = new Set(['__menu__', '__select__'])

onMounted(() => {
  api.value = props.params.api
  columnApi.value = props.params.columnApi
})

/** visible columns in current order (including pinned) */
function getVisibleColumnIds() {
  return (
    api.value
      ?.getAllDisplayedColumns?.()
      .map(c => c.getColId())
      .filter(id => !EXCLUDE_COL_IDS.has(id)) || []
  )
}

/**
 * all columns, keep sensible order:
 * - visible columns in displayed order first
 * - then hidden columns by column state order
 */
function getAllBusinessColumnIdsInOrder() {
  if (!columnApi.value) return []

  const visible = getVisibleColumnIds()

  const state = columnApi.value.getColumnState?.() || []
  const orderedAll = state
    .map(s => s.colId)
    .filter(Boolean)
    .filter(id => !EXCLUDE_COL_IDS.has(id))

  const set = new Set(visible)
  const rest = orderedAll.filter(id => !set.has(id))
  return [...visible, ...rest]
}

function makeFileName(base) {
  const now = new Date()
  const t =
    now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    '_' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0')
  return `${base}_${t}.csv`
}

// CSV escaping helper (quotes, commas, newlines)
function escapeCsvValue(value) {
  if (value == null) return ''
  const str = String(value).replace(/\r?\n/g, ' ')
  // quote if it includes quotes, comma, newline
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function exportCsv({ mode = 'visible', onlySelected = false }) {
  if (!api.value || !columnApi.value) {
    ElMessage.error('Grid API not ready')
    return
  }

  // selected rows check
  if (onlySelected) {
    const cnt = api.value.getSelectedNodes?.()?.length || 0
    if (cnt === 0) {
      ElMessage.warning('選択行がありません。行を選択してから実行してください。')
      return
    }
  }

  // decide columns
  const columnKeys = mode === 'all' ? getAllBusinessColumnIdsInOrder() : getVisibleColumnIds()
  if (!columnKeys.length) {
    ElMessage.warning('エクスポート対象の列がありません')
    return
  }

  // ---- Row 1: field names (or colId fallback) ----
  const fieldNamesRow = columnKeys
    .map(colId => {
      const col = columnApi.value.getColumn(colId)
      const field = col?.getColDef?.()?.field
      return escapeCsvValue(field ?? colId)
    })
    .join(',')

  // ---- Row 2: headerName ----
  const headerNamesRow = columnKeys
    .map(colId => {
      const col = columnApi.value.getColumn(colId)
      const headerName = col?.getColDef?.()?.headerName ?? ''
      return escapeCsvValue(headerName)
    })
    .join(',')

  // ---- Row 3+: data rows only (IMPORTANT: skipColumnHeaders) ----
  let dataRowsCsv = ''
  try {
    dataRowsCsv = api.value.getDataAsCsv({
      columnKeys,
      onlySelected,

      // ✅ critical: this removes AG Grid's own header row
      skipColumnHeaders: true,
      skipColumnGroupHeaders: true,
      skipFooters: true,

      // export display value if valueFormatter exists (締め済/未締め etc.)
      useValueFormatterForExport: true,
      processCellCallback: (p) => (p.valueFormatted ?? p.value ?? ''),
    })
  } catch (err) {
    console.error('CSV data generation failed', err)
    ElMessage.error('データ行の生成に失敗しました')
    return
  }

  // ---- Assemble (BOM + Row1 + Row2 + data) ----
  let fullCsv = '\ufeff' + fieldNamesRow + '\n' + headerNamesRow
  if (dataRowsCsv && dataRowsCsv.trim()) {
    fullCsv += '\n' + dataRowsCsv.trim()
  }

  // ---- download ----
  const fileName = makeFileName(
    mode === 'all'
      ? (onlySelected ? 'allcols_selected' : 'allcols_allrows')
      : (onlySelected ? 'visible_selected' : 'visible_allrows')
  )

  const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success(`CSVエクスポート完了: ${fileName}`)
}

/** ---- other actions ---- **/
function autoSize() {
  const cols = columnApi.value?.getAllColumns?.() || []
  const ids = cols.map(c => c.getColId()).filter(id => !EXCLUDE_COL_IDS.has(id))
  columnApi.value?.autoSizeColumns?.(ids)
}

function openColumnSettings() {
  props.params.context?.openColumnSettings?.()
}

function openQuickFilter() {
  props.params.context?.openQuickFilter?.()
}

// ✅ 追加
const exportFilteredCsv = () => {
  props.params.context.exportFilteredCsv()
}

const exportFilteredCsvUtf8 = () => {
  props.params?.context?.exportFilteredCsvUtf8?.()
}

const exportFilteredCsvSjis = () => {
  props.params?.context?.exportFilteredCsvSjis?.()
}
</script>

<template>
  <el-dropdown trigger="click">
    <span style="cursor:pointer; display:flex; align-items:center;">
      <el-icon><MoreFilled /></el-icon>
    </span>

    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item @click="exportCsv({ mode: 'visible', onlySelected: false })">
          表示列CSV出力（全行）
        </el-dropdown-item>

        <el-dropdown-item @click="exportCsv({ mode: 'visible', onlySelected: true })">
          表示列CSV出力（選択行）
        </el-dropdown-item>

        <el-dropdown-item divided @click="exportCsv({ mode: 'all', onlySelected: false })">
          全列CSV出力（全行）
        </el-dropdown-item>

        <el-dropdown-item @click="exportCsv({ mode: 'all', onlySelected: true })">
          全列CSV出力（選択行）
        </el-dropdown-item>

        <el-dropdown-item divided @click="openQuickFilter">
          クイックフィルター
        </el-dropdown-item>

         <!-- ✅ 追加 -->
        <el-dropdown-item divided @click="exportFilteredCsv">
          表示中行CSV出力
        </el-dropdown-item>

        <el-dropdown-item divided @click="exportFilteredCsvUtf8">
          表示中行CSV出力（UTF-8）
        </el-dropdown-item>

        <el-dropdown-item @click="exportFilteredCsvSjis">
          表示中行CSV出力（Shift-JIS）
        </el-dropdown-item>        

        <el-dropdown-item @click="autoSize">
          カラムサイズ自動調整
        </el-dropdown-item>

        <el-dropdown-item divided @click="openColumnSettings">
          カラム設定
        </el-dropdown-item>
        
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
