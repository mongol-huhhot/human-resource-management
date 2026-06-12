<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  modelValue: { type: Object, default: null }, // { start_time, end_time, relative_end_day }
  mode: { type: String, default: 'HH:MI' },    // 'HH:MI' | 'YYYY-MM-DDTHH:MI'
  baseDate: { type: String, default: dayjs().format('YYYY-MM-DD') },
  workLastingDays: {
    type: Array,
    default: () => ([
      { label: '同日(+0)', value: 0 },
      { label: '翌日(+1)', value: 1 },
      { label: '2日後(+2)', value: 2 },
    ]),
  },
  minuteStep: { type: Number, default: 15 },
  picker: { type: String, default: 'select' }, // 'native' | 'select'
})

const emit = defineEmits(['update:modelValue'])

/* ---------- utils ---------- */
const clampHM = (val) => {
  if (!val) return ''
  const [h, m] = String(val).split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return ''
  const step = Math.max(1, Number(props.minuteStep) || 1)
  let total = Math.floor((h * 60 + m) / step) * step
  total = Math.max(0, Math.min(total, 24 * 60 - step))
  const hh = String(Math.floor(total / 60)).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

const makeTimeOptions = (stepMins = 15) => {
  const items = []
  for (let t = 0; t < 24 * 60; t += stepMins) {
    const hh = String(Math.floor(t / 60)).padStart(2, '0')
    const mm = String(t % 60).padStart(2, '0')
    const v = `${hh}:${mm}`
    items.push({ title: v, value: v })
  }
  return items
}
const timeOptions = computed(() => makeTimeOptions(Math.max(1, props.minuteStep || 1)))

const buildDateTime = (base, hm, offsetDays = 0) => {
  const [h, m] = String(hm || '00:00').split(':').map(Number)
  return dayjs(base).add(Number(offsetDays) || 0, 'day')
    .hour(Number.isFinite(h) ? h : 0)
    .minute(Number.isFinite(m) ? m : 0)
    .second(0).millisecond(0)
}
const fmtOut = (d) => d.format('YYYY-MM-DDTHH:mm')

/* ---------- local state (always HH:mm) ---------- */
const core = ref({
  start_hm: dayjs().second(0).millisecond(0).format('HH:mm'),
  end_hm:   dayjs().second(0).millisecond(0).add(1, 'hour').format('HH:mm'),
  relative_end_day: 0,
})

/* ---------- emit builder + safe emit ---------- */
function buildOutgoing() {
  const red = Number(core.value.relative_end_day) || 0
  if (props.mode === 'YYYY-MM-DDTHH:MI') {
    const s = buildDateTime(props.baseDate, core.value.start_hm, 0)
    const e = buildDateTime(props.baseDate, core.value.end_hm, red)
    return { start_time: fmtOut(s), end_time: fmtOut(e), relative_end_day: red }
  }
  return {
    start_time: clampHM(core.value.start_hm),
    end_time: clampHM(core.value.end_hm),
    relative_end_day: red,
  }
}

function shallowEqual(a, b) {
  if (!a || !b) return false
  return a.start_time === b.start_time &&
         a.end_time === b.end_time &&
         Number(a.relative_end_day) === Number(b.relative_end_day)
}

function maybeEmitFormatted() {
  const next = buildOutgoing()
  if (!shallowEqual(next, props.modelValue || {})) {
    emit('update:modelValue', next)
  }
}

/* ---------- hydrate from model (accept HH:mm or full datetime) ---------- */
function hydrateFromModel(v) {
  const now = dayjs().second(0).millisecond(0)
  const defaults = {
    start_hm: now.format('HH:mm'),
    end_hm: now.add(1, 'hour').format('HH:mm'),
    relative_end_day: 0,
  }
  if (!v) { core.value = { ...defaults }; return }

  const parseHM = (t) => {
    if (!t || typeof t !== 'string') return null
    if (t.includes('T')) {
      const d = dayjs(t)
      return d.isValid() ? d.format('HH:mm') : null
    }
    const d = dayjs(t, 'HH:mm', true)
    return d.isValid() ? d.format('HH:mm') : null
  }

  let red = Number(v.relative_end_day)
  if (!Number.isFinite(red)) {
    // Derive from dates if full datetime provided
    if (v.start_time?.includes('T') && v.end_time?.includes('T')) {
      const ds = dayjs(v.start_time), de = dayjs(v.end_time)
      if (ds.isValid() && de.isValid()) {
        red = Math.max(0, de.startOf('day').diff(ds.startOf('day'), 'day'))
      }
    } else red = 0
  }

  const sHM = clampHM(parseHM(v.start_time) ?? defaults.start_hm)
  const eHM = clampHM(parseHM(v.end_time)   ?? defaults.end_hm)

  core.value.start_hm = sHM
  core.value.end_hm   = eHM
  core.value.relative_end_day = red
}

watch(
  () => [props.modelValue, props.baseDate, props.minuteStep],
  () => { hydrateFromModel(props.modelValue); maybeEmitFormatted() }, // <-- emit after hydrate if needed
  { immediate: true, deep: true }
)

// If just the output mode changes, re-emit in the new format
watch(() => props.mode, () => { /* no need to re-hydrate */ maybeEmitFormatted() })

/* ---------- validation ---------- */
const validationError = computed(() => {
  const s = buildDateTime(props.baseDate, core.value.start_hm, 0)
  const e = buildDateTime(props.baseDate, core.value.end_hm, core.value.relative_end_day)
  if (!s.isValid() || !e.isValid()) return null
  return e.isAfter(s) ? null : '終了時刻は、開始時刻より後（終了日日跨ぎを加味）である必要があります。'
})

/* ---------- proxies ---------- */
const startHHmm = computed({
  get: () => core.value.start_hm,
  set: (val) => {
    const hm = clampHM(val)
    if (!hm) return
    core.value.start_hm = hm
    if (!core.value.end_hm) {
      core.value.end_hm = clampHM(buildDateTime(props.baseDate, hm).add(1, 'hour').format('HH:mm'))
    }
    maybeEmitFormatted()
  },
})
const endHHmm = computed({
  get: () => core.value.end_hm,
  set: (val) => {
    const hm = clampHM(val)
    if (!hm) return
    core.value.end_hm = hm
    maybeEmitFormatted()
  },
})

function onOffsetChange(offset) {
  core.value.relative_end_day = Number(offset) || 0
  maybeEmitFormatted()
}

onMounted(() => {
  // If parent gave nothing, push defaults in requested format
  if (!props.modelValue) maybeEmitFormatted()
})
</script>

<template>
  <div class="time-range-editor">
    <!-- Start -->
    <div class="field">
      <template v-if="picker === 'native'">
        <VTextField
          v-model="startHHmm"
          label="開始時刻"
          type="time"
          density="compact"
          :step="minuteStep * 60"
          hide-details="auto"
          variant="outlined"
        />
      </template>
      <template v-else>
        <VAutocomplete
          v-model="startHHmm"
          :items="timeOptions"
          label="開始時刻"
          density="compact"
          hide-details="auto"
          variant="outlined"
        />
      </template>
    </div>

    <!-- End -->
    <div class="field">
      <template v-if="picker === 'native'">
        <VTextField
          v-model="endHHmm"
          label="終了時刻"
          type="time"
          density="compact"
          :step="minuteStep * 60"
          hide-details="auto"
          variant="outlined"
        />
      </template>
      <template v-else>
        <VAutocomplete
          v-model="endHHmm"
          :items="timeOptions"
          label="終了時刻"
          density="compact"
          hide-details="auto"
          variant="outlined"
        />
      </template>
    </div>

    <!-- Relative end day -->
    <div class="field">
      <VAutocomplete
        v-model="core.relative_end_day"
        :items="workLastingDays"
        item-title="label"
        item-value="value"
        label="終了日日跨ぐ"
        density="compact"
        style="min-width: 140px"
        @update:modelValue="onOffsetChange"
        hide-details="auto"
        variant="outlined"
      />
    </div>

    <div v-if="validationError" class="error-msg">
      {{ validationError }}
    </div>
  </div>
</template>

<style scoped>
.time-range-editor {
  display: grid;
  grid-template-columns: 160px 160px 1fr;
  gap: 12px;
  align-items: center;
}
.time-range-editor :deep(.v-input__details) { display: none; }
.field { display: flex; flex-direction: column; }
.error-msg {
  grid-column: 1 / -1;
  color: #d32f2f;
  font-size: 12px;
  margin-top: -6px;
}
</style>
