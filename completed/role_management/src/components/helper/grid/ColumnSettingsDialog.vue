<script setup>
import { onMounted, ref } from 'vue'

const props = defineProps({
  params: Object,
})

const api = ref(null)
const columnApi = ref(null)

const EXCLUDE_COL_IDS = new Set([
  '__menu__',
  '__select__',
])

onMounted(() => {
  api.value = props.params?.api
  columnApi.value = props.params?.columnApi
})

function getVisibleColumnIds() {
  return (
    api.value
      ?.getAllDisplayedColumns?.()
      .map(c => c.getColId())
      .filter(id => !EXCLUDE_COL_IDS.has(id)) || []
  )
}

function getAllBusinessColumnIdsInOrder() {
  if (!columnApi.value) return []

  const visible = getVisibleColumnIds()

  const state =
    columnApi.value.getColumnState?.() || []

  const orderedAll = state
    .map(s => s.colId)
    .filter(Boolean)
    .filter(id => !EXCLUDE_COL_IDS.has(id))

  const set = new Set(visible)

  const rest = orderedAll.filter(
    id => !set.has(id)
  )

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

function escapeCsvValue(value) {
  if (value == null) return ''

  const str = String(value).replace(/\r?\n/g, ' ')

  if (
    str.includes('"') ||
    str.includes(',') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

function showMessage(type, text) {
  // Vuetify標準ではToastがないため簡易版
  console.log(`[${type}] ${text}`)
}

function exportCsv({
  mode = 'visible',
  onlySelected = false,
}) {
  if (!api.value || !columnApi.value) {
    showMessage('error', 'Grid API not ready')
    return
  }

  if (onlySelected) {
    const cnt =
      api.value.getSelectedNodes?.()?.length || 0

    if (cnt === 0) {
      showMessage(
        'warning',
        '選択行がありません。行を選択してから実行してください。'
      )
      return
    }
  }

  const columnKeys =
    mode === 'all'
      ? getAllBusinessColumnIdsInOrder()
      : getVisibleColumnIds()

  if (!columnKeys.length) {
    showMessage(
      'warning',
      'エクスポート対象の列がありません'
    )
    return
  }

  const fieldNamesRow = columnKeys
    .map(colId => {
      const col = columnApi.value.getColumn(colId)
      const field = col?.getColDef?.()?.field
      return escapeCsvValue(field ?? colId)
    })
    .join(',')

  const headerNamesRow = columnKeys
    .map(colId => {
      const col = columnApi.value.getColumn(colId)

      const headerName =
        col?.getColDef?.()?.headerName ?? ''

      return escapeCsvValue(headerName)
    })
    .join(',')

  let dataRowsCsv = ''

  try {
    dataRowsCsv = api.value.getDataAsCsv({
      columnKeys,
      onlySelected,

      skipColumnHeaders: true,
      skipColumnGroupHeaders: true,
      skipFooters: true,

      useValueFormatterForExport: true,

      processCellCallback: (p) =>
        p.valueFormatted ?? p.value ?? '',
    })
  } catch (err) {
    console.error(err)

    showMessage(
      'error',
      'データ行の生成に失敗しました'
    )

    return
  }

  let fullCsv =
    '\ufeff' +
    fieldNamesRow +
    '\n' +
    headerNamesRow

  if (dataRowsCsv && dataRowsCsv.trim()) {
    fullCsv += '\n' + dataRowsCsv.trim()
  }

  const fileName = makeFileName(
    mode === 'all'
      ? (
          onlySelected
            ? 'allcols_selected'
            : 'allcols_allrows'
        )
      : (
          onlySelected
            ? 'visible_selected'
            : 'visible_allrows'
        )
  )

  const blob = new Blob(
    [fullCsv],
    {
      type: 'text/csv;charset=utf-8;',
    }
  )

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.style.visibility = 'hidden'

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)

  URL.revokeObjectURL(url)

  showMessage(
    'success',
    `CSVエクスポート完了: ${fileName}`
  )
}

function autoSize() {
  const cols =
    columnApi.value?.getAllColumns?.() || []

  const ids = cols
    .map(c => c.getColId())
    .filter(id => !EXCLUDE_COL_IDS.has(id))

  columnApi.value?.autoSizeColumns?.(ids)
}

function openColumnSettings() {
  props.params.context?.openColumnSettings?.()
}

function openQuickFilter() {
  props.params.context?.openQuickFilter?.()
}
</script>

<template>
  <v-menu location="bottom end">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        icon
        variant="text"
        size="small"
      >
        <v-icon>
          mdi-dots-horizontal
        </v-icon>
      </v-btn>
    </template>

    <v-list density="compact">
      <v-list-item
        @click="exportCsv({ mode: 'visible', onlySelected: false })"
      >
        <v-list-item-title>
          表示列CSV出力（全行）
        </v-list-item-title>
      </v-list-item>

      <v-list-item
        @click="exportCsv({ mode: 'visible', onlySelected: true })"
      >
        <v-list-item-title>
          表示列CSV出力（選択行）
        </v-list-item-title>
      </v-list-item>

      <v-divider />

      <v-list-item
        @click="exportCsv({ mode: 'all', onlySelected: false })"
      >
        <v-list-item-title>
          全列CSV出力（全行）
        </v-list-item-title>
      </v-list-item>

      <v-list-item
        @click="exportCsv({ mode: 'all', onlySelected: true })"
      >
        <v-list-item-title>
          全列CSV出力（選択行）
        </v-list-item-title>
      </v-list-item>

      <v-divider />

      <v-list-item
        @click="openQuickFilter"
      >
        <v-list-item-title>
          クイックフィルター
        </v-list-item-title>
      </v-list-item>

      <v-list-item
        @click="autoSize"
      >
        <v-list-item-title>
          カラムサイズ自動調整
        </v-list-item-title>
      </v-list-item>

      <v-divider />

      <v-list-item
        @click="openColumnSettings"
      >
        <v-list-item-title>
          カラム設定
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>