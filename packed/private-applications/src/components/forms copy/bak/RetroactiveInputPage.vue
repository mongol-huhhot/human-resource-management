<!-- RetroactiveInputPage.vue -->
<script setup>
import { ref, watch, computed } from 'vue'
import { ElCard, ElButton } from 'element-plus'
import VariableDataEditForm from './VariableDataEditForm.vue'
import { toNumber, }  from '@/composables/useUtils'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ months: [] }),
  },
  sourceRows: {
    type: Array,
    default: () => [],
  },
  staffInfo: {
    type: Object,
    default: () => ({}),
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'update:totals'])

const variableForm = ref({ months: [] })
const totals = ref([])

const syncingFromParent = ref(false)

const staffName = computed(() => {
  const code = props.staffInfo?.staff_code ?? ''
  const name = props.staffInfo?.staff_name ?? ''
  return [code, name].filter(Boolean).join(':')
})

const buildFormFromRows = (rows) => {
  if (!rows || rows.length === 0) {
    return { months: [] }
  }

  const sortedRows = [...rows].sort((a, b) =>
    String(a.salary_date).localeCompare(String(b.salary_date))
  )

  return {
    months: sortedRows.map((r) => {
      const monthRow = {
        label: r.cal_month,
        salaryDate: r.salary_date,
        salaryYm: r.salary_ym,
        monthEnd: toNumber(r.month_end),
        calculationDays: toNumber(r.calculation_days),

        rewardAmount: toNumber(r.original_j9107),
        origRewardAmount: toNumber(r.orig_reward_amount),
        shortTimeFlag: toNumber(r.orig_short_time_flag),

        mealUnitPrice: toNumber(r.meal_unit_price),
        mealDays: toNumber(r.meal_days),
        mealAmount: toNumber(r.meal_amount),
        housingBenefit: toNumber(r.housing_benefit),
        cashReward: toNumber(r.cash_reward),
        monthlyVariableAmount: toNumber(r.monthly_variable_amount),

        totalAmount: toNumber(r.total_amount),
      }
      return monthRow
    }),
  }
}

const buildTotalsFromRows = (rows) => {
  if (!rows || rows.length === 0) return []

  const sortedRows = [...rows].sort((a, b) =>
    String(a.salary_date).localeCompare(String(b.salary_date))
  )

  return sortedRows.map((r) => ({
    month: r.cal_month,
    lunchAmount: toNumber(r.meal_amount),
    totalAmount: toNumber(r.total_amount),
  }))
}

/**
 * sourceRows が変わった時だけ初期フォームを作る
 * ここでは親へ emit しない
 */
watch(
  () => props.sourceRows,
  (rows) => {
    syncingFromParent.value = true
    variableForm.value = buildFormFromRows(rows)
    totals.value = buildTotalsFromRows(rows)
    emit('update:totals', structuredClone(totals.value))
    syncingFromParent.value = false
  },
  { immediate: true, deep: true }
)

/**
 * 親から modelValue が入ってきた場合だけ反映
 * ただし sourceRows 初期化との循環を避けるため最小限
 */
watch(
  () => props.modelValue,
  (val) => {
    if (!val || typeof val !== 'object') return

    const next = structuredClone(val)
    const curr = structuredClone(variableForm.value)

    if (JSON.stringify(next) === JSON.stringify(curr)) return

    syncingFromParent.value = true
    variableForm.value = next
    syncingFromParent.value = false
  },
  { deep: true }
)

/**
 * 子の編集結果を親へ返す
 * ただし親同期中は emit しない
 */
watch(
  variableForm,
  (val) => {
    if (syncingFromParent.value) return
    emit('update:modelValue', structuredClone(val))
  },
  { deep: true }
)

const handleTotalsUpdate = (val) => {
  totals.value = structuredClone(val || [])
  emit('update:totals', structuredClone(totals.value))
}

const handleSave = () => {
  emit('save', structuredClone(variableForm.value))
}
</script>

<template>
  <div class="page-wrap" v-loading="loading || saving">
    <el-card class="edit-card">
      <template #header>
        <div class="card-header">
          <span>I.通貨・現物データ編集</span>
          <small>
            <el-button type="success" :loading="saving" @click="handleSave" :disabled="readonly">
              編集データ保存
            </el-button>
          </small>
        </div>
      </template>

      <VariableDataEditForm
        v-model="variableForm"
        :staff-name="staffName"
        @update:totals="handleTotalsUpdate"
        :readonly="readonly"
      />
    </el-card>
  </div>
</template>

<style scoped>
.page-wrap {
  width: 100%;
  box-sizing: border-box;
}

.edit-card {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0px;
  font-size: 18px;
  font-weight: 700;
  color: #1f2d3d;
  flex-wrap: wrap;
}
</style>