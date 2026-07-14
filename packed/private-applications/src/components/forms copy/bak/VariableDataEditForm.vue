<script setup>
import { computed, watch } from 'vue'
import { ElInput, ElInputNumber } from 'element-plus'
import { toNumber,formatYen, }  from '@/composables/useUtils'

defineProps({
  staffName: {
    type: String,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const model = defineModel({
  type: Object,
  required: true,
})

const emit = defineEmits(['update:totals'])

const recalculateRow = (row) => {
  const rewardAmount = toNumber(row.rewardAmount)
  const mealUnitPrice = toNumber(row.mealUnitPrice)
  const mealDays = toNumber(row.mealDays)
  const housingBenefit = toNumber(row.housingBenefit)
  const cashReward = toNumber(row.cashReward)
  const monthlyVariableAmount = toNumber(row.monthlyVariableAmount)

  row.mealAmount = mealUnitPrice * mealDays
  row.totalAmount =
    rewardAmount +
    row.mealAmount +
    housingBenefit +
    cashReward +
    monthlyVariableAmount
}

const recalculateAllRows = () => {
  if (!model.value?.months?.length) return
  model.value.months.forEach((row) => {
    recalculateRow(row)
  })
}

watch(
  () => model.value.months,
  () => {
    recalculateAllRows()
  },
  { immediate: true, deep: true }
)

const totals = computed(() => {
  return (model.value.months || []).map((row) => ({
    month: row.label,
    lunchAmount: toNumber(row.mealAmount),
    totalAmount: toNumber(row.totalAmount),
  }))
})

watch(
  totals,
  (val) => {
    emit('update:totals', val)
  },
  { immediate: true, deep: true }
)
</script>

<template>
    <div class="edit-table">
      <div class="cell head item-col">項目名</div>
      <div
        v-for="(row, index) in model.months"
        :key="`head-${index}`"
        class="cell head month-col"
      >
        {{ row.label }}
      </div>

      <div class="cell item-col">月末</div>
      <div
        v-for="(row, index) in model.months"
        :key="`monthEnd-${index}`"
        class="cell value-cell"
      >
        {{ row.monthEnd }}
      </div>

      <div class="cell item-col">算定日数</div>
      <div
        v-for="(row, index) in model.months"
        :key="`calcDays-${index}`"
        class="cell input-cell"
      >
        <el-input-number
          v-model="row.calculationDays"
          :min="0"
          controls-position="right"
          class="full-width"
          :disabled="readonly"
        />
      </div>

      <div class="cell item-col">報酬月額</div>
      <div
        v-for="(row, index) in model.months"
        :key="`reward-${index}`"
        class="cell value-cell"
      >
        {{ formatYen(row.rewardAmount) }}
      </div>

      <div class="cell item-col">食事単価</div>
      <div
        v-for="(row, index) in model.months"
        :key="`mealUnit-${index}`"
        class="cell input-cell"
      >
        <el-input
          v-model="row.mealUnitPrice"
          class="full-width"
        >
          <template #prefix>¥</template>
        </el-input>
      </div>

      <div class="cell item-col">食事日数</div>
      <div
        v-for="(row, index) in model.months"
        :key="`mealDays-${index}`"
        class="cell input-cell"
      >
        <el-input-number
          v-model="row.mealDays"
          :min="0"
          controls-position="right"
          class="full-width"
          :disabled="readonly"
        />
      </div>

      <div class="cell item-col">食事代</div>
      <div
        v-for="(row, index) in model.months"
        :key="`lunchAmount-${index}`"
        class="cell value-cell"
      >
        {{ formatYen(row.mealAmount) }}
      </div>

      <div class="cell item-col">社宅現物</div>
      <div
        v-for="(row, index) in model.months"
        :key="`housing-${index}`"
        class="cell input-cell"
      >
        <el-input
          v-model="row.housingBenefit"
          class="full-width"
          :readonly="readonly"          
        >
          <template #prefix>¥</template>
        </el-input>
      </div>

      <div class="cell item-col">報酬現金</div>
      <div
        v-for="(row, index) in model.months"
        :key="`cashReward-${index}`"
        class="cell input-cell"
      >
        <el-input
          v-model="row.cashReward"
          class="full-width"
          :readonly="readonly"
        >
          <template #prefix>¥</template>
        </el-input>
      </div>

      <div class="cell item-col">月額変動金額</div>
      <div
        v-for="(row, index) in model.months"
        :key="`monthlyVar-${index}`"
        class="cell input-cell"
      >
        <el-input
          v-model="row.monthlyVariableAmount"
          class="full-width"
          :readonly="readonly"          
        >
          <template #prefix>¥</template>
        </el-input>
      </div>

      <div class="cell item-col total-label">合計</div>
      <div
        v-for="(row, index) in model.months"
        :key="`total-${index}`"
        class="cell total-cell"
      >
        {{ formatYen(row.totalAmount) }}
      </div>
    </div>
  <!-- </el-card> -->
</template>

<style scoped>

.edit-table {
  display: grid;
  grid-template-columns: 150px repeat(3, 1fr);
  border-top: 1px solid #dcdfe6;
  border-left: 1px solid #dcdfe6;
  font-size: .9em;
}

.cell {
  min-height: 56px;
  padding: 10px 12px;
  border-right: 1px solid #dcdfe6;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.head {
  background: #f5f7fa;
  font-weight: 700;
  justify-content: center;
}

.item-col {
  background: #fafafa;
  font-weight: 600;
  color: #606266;
}

.month-col {
  text-align: center;
}

.value-cell {
  justify-content: center;
  color: #606266;
}

.input-cell {
  justify-content: center;
  background: #fbfdff;
}

.total-label,
.total-cell {
  background: #f5f7fa;
  font-weight: 500;
}

.total-cell {
  justify-content: center;
}

.full-width {
  width: 100%;
}
</style>