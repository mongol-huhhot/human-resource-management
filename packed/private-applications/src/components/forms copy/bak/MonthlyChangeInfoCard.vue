<!-- 
 MonthlyChangeInfoCard.vue
  月変・算定の確定時の情報
  -->
<script setup>
import {  watch } from 'vue'
import { 
  ElCard, 
  ElCheckbox, 

} from 'element-plus'
import { formatYen, }  from '@/composables/useUtils'

defineProps({
  title: {
    type: String,
    default: 'III.随時改定情報',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  hoken_toukyu:{
    type: Object,
    default: ()=>({}),
  },
  is_monthly_change_candidate: {
    type: Boolean,
    default: false,
  }
})

const model = defineModel({
  type: Object,
  required: true,
})

// const toNumber = (value) => {
//   if (value === null || value === undefined || value === '') return 0
//   const n = Number(String(value).replace(/,/g, ''))
//   return Number.isNaN(n) ? 0 : n
// }

// const formatYen = (value) => {
//   return `¥ ${toNumber(value).toLocaleString()}`
// }

watch(
  () => model.value.isMonthlyChangeTargetCalculated,
  (val) => {
    if (!val) {
      model.value.isMonthlyChangeTargetConfirmed = true
    }
  }
)

watch(
  () => model.value.isMonthlyChangeTargetConfirmed,
  (val) => {
    if (val) {
      model.value.isMonthlyChangeTargetCalculated = true
    }
  }
)

</script>

<template>
  <el-card class="change-info-card">
    <template #header>
      <div class="card-header">
        {{ title }}
      </div>
    </template>

    <div class="summary-row">
      <div class="summary-item">
        <span class="summary-label">3ヶ月の総計額:</span>
        <span class="summary-value">{{ formatYen(hoken_toukyu.sum_j9107) }}</span>
      </div>

      <div class="summary-item">
        <span class="summary-label">3ヶ月の平均額:</span>
        <span class="summary-value">{{ formatYen(hoken_toukyu.avg_j9107) }}</span>
      </div>
    </div>

    <div class="flag-row">
      <el-checkbox
        :model-value="is_monthly_change_candidate"
        disabled
      >
        改定対象（算出）
      </el-checkbox>

      <el-checkbox
        v-model="model.isMonthlyChangeTargetConfirmed"
        disabled
      >
        改定対象（確定）
      </el-checkbox>
    </div>

    <div class="main-area">
      <div class="info-box">
        <div class="box-title">現在の標準報酬月額</div>

        <div class="line-row">
          <div class="line-label">健康保険</div>
          <div class="line-value">{{ formatYen(hoken_toukyu?.j4110) }}</div>
          <div class="line-grade">({{ hoken_toukyu?.common_insurance_grade }}等級)</div>
        </div>
        <div class="line-row">
          <div class="line-label">厚生年金保険</div>
          <div class="line-value">{{ formatYen(hoken_toukyu?.j4112) }}</div>
          <div class="line-grade">({{ hoken_toukyu?.nation_insurance_grade }}等級)</div>
        </div>
      </div>

      <div class="arrow-area">→</div>

      <div class="info-box">
        <div class="box-title">平均報酬月額から算出される標準報酬月額</div>

        <div class="line-row">
          <div class="line-label">健康保険</div>
          <div class="line-value">{{ formatYen(hoken_toukyu?.r_common_amount_standard) }}</div>
          <div class="line-grade">({{ hoken_toukyu?.r_common_insurance_grade }}等級)</div>

        </div>

        <div class="line-row">
          <div class="line-label">厚生年金保険</div>
          <div class="line-value">{{ formatYen(hoken_toukyu?.r_nation_amount_standard) }}</div>
          <div class="line-grade">({{ hoken_toukyu?.r_nation_insurance_grade }}等級)</div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.change-info-card {
  width: 94%;
  padding: 8px;
  margin-bottom: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: 700;
  color: #1f2d3d;
}

.summary-row {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  padding: 8px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 15px;
  font-weight: 700;
  color: #303133;
}

.summary-value {
  font-size: 15px;
  font-weight: 700;
  color: #606266;
}

.flag-row {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 12px;
}

.main-area {
  display: grid;
  grid-template-columns: minmax(260px, 350px) 40px minmax(260px, 350px);
  gap: 8px;
  align-items: center;
  padding-bottom: 20px;
}

.info-box {
  border: 1px solid #dcdfe6;
  background: #fff;
  padding: 18px 18px 14px 18px;
  min-height: 118px;
  box-sizing: border-box;
}

.box-title {
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 14px;
}

.line-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.line-label {
  font-size: 15px;
  color: #303133;
}

.line-value {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  text-align: right;
  min-width: 96px;
}

.line-grade {
  font-size: 14px;
  color: #606266;
  min-width: 64px;
}

.arrow-area {
  text-align: center;
  font-size: 28px;
  color: #606266;
  user-select: none;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

@media (max-width: 900px) {
  .main-area {
    grid-template-columns: 1fr;
  }

  .arrow-area {
    transform: rotate(90deg);
  }
}

.flag-row {
  padding: 8px; 
}
</style>
