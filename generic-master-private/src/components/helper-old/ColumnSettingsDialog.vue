<script setup>
import { computed, ref, watch } from 'vue'
import { ElDialog, ElCheckbox, ElButton } from 'element-plus'
import { useStorage } from '@vueuse/core'

const props = defineProps({
  open: Boolean,
  columns: { type: Array, required: true },
  visibleMap: { type: Object, required: true },
  storageKey: { type: String, default: 'aggrid:columnVisibility' },
})
const emit = defineEmits(['update:open', 'apply'])

const selectableCols = computed(() => (props.columns || []).filter(c => c.field))

function sanitizeMap(map) {
  const allowed = new Set(selectableCols.value.map(c => c.field))
  const out = {}
  for (const [k, v] of Object.entries(map || {})) {
    if (allowed.has(k)) out[k] = v !== false // normalize boolean; default true
  }
  return out
}

function buildDefaultMap() {
  const m = {}
  selectableCols.value.forEach(c => { m[c.field] = true })
  return m
}

/**
 * Persisted map in localStorage.
 * - default: {}
 * - we sanitize/merge later because columns can change
 */
const storedMap = useStorage(props.storageKey, {})

const local = ref({})

function rebuildLocal() {
  // base from parent
  const base = sanitizeMap(props.visibleMap || {})

  // ensure new columns default visible
  selectableCols.value.forEach(c => {
    if (!(c.field in base)) base[c.field] = true
  })

  // overlay stored (if any)
  const saved = sanitizeMap(storedMap.value || {})
  local.value = { ...base, ...saved }
}

// rebuild when inputs change
watch(
  () => [props.columns, props.visibleMap],
  () => rebuildLocal(),
  { immediate: true, deep: true }
)

// refresh from storage on open (if other page changed it)
watch(
  () => props.open,
  (isOpen) => { if (isOpen) rebuildLocal() }
)

const selectAll = computed({
  get() {
    const cols = selectableCols.value
    if (!cols.length) return false
    return cols.every(c => local.value[c.field] !== false)
  },
  set(val) {
    selectableCols.value.forEach(c => { local.value[c.field] = !!val })
  }
})

function close() {
  emit('update:open', false)
}

function apply() {
  // only persist valid keys; ensure all selectable keys exist
  const payload = sanitizeMap(local.value)
  selectableCols.value.forEach(c => {
    if (!(c.field in payload)) payload[c.field] = true
  })

  // write to localStorage via vueuse
  storedMap.value = { ...payload }

  // notify parent
  emit('apply', { ...payload })
  close()
}

function reset() {
  // clear storage + set defaults
  storedMap.value = {}
  local.value = buildDefaultMap()
  // optional: also apply immediately
  emit('apply', { ...local.value })
}
</script>

<template>
  <el-dialog
    :model-value="open"
    title="Column Settings"
    width="520px"
    @close="close"
  >
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <div>Show / Hide Columns</div>
      <div style="display:flex; gap:10px; align-items:center;">
        全選択 <el-checkbox v-model="selectAll" />
        <el-button size="small" @click="reset">リセット</el-button>
      </div>
    </div>

    <div style="max-height: 420px; overflow:auto; border:1px solid #eee; padding:8px; border-radius:8px;">
      <div
        v-for="c in selectableCols"
        :key="c.field"
        style="display:flex; justify-content:space-between; align-items:center; padding:6px 4px;"
      >
        <div>{{ c.headerName }} ({{ c.field }})</div>
        <el-checkbox v-model="local[c.field]" />
      </div>
    </div>

    <template #footer>
      <el-button @click="close">キャンセル</el-button>
      <el-button type="primary" @click="apply">適用</el-button>
    </template>
  </el-dialog>
</template>
