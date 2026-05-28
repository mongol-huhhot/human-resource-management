<!-- RetroactiveNoteEditForm.vue
 月変・算定の確定時の情報
  -->
<script setup>
// import { computed } from 'vue'
import {
  ElCard,
  ElInput,
  ElDatePicker,
  ElSelect,
  ElOption,
  ElCheckbox,
  ElButton,
} from 'element-plus'

import { toNumber, }  from '@/composables/useUtils'

defineProps({
  title: {
    type: String,
    default: 'II.備考データ編集',
  },
  readonlyCorrectedAverageAmount: {
    type: Boolean,
    default: false,
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

const emit = defineEmits(['save'])

// const salaryTypes = computed(() => model.value.salaryTypeOptions ?? [])

// const toNumber = (value) => {
//   if (value === null || value === undefined || value === '') return 0
//   const n = Number(String(value).replace(/,/g, ''))
//   return Number.isNaN(n) ? 0 : n
// }

const normalizeNumericField = (fieldName) => {
  model.value[fieldName] = toNumber(model.value[fieldName])
}

const handleSave = () => {
  emit('save', model.value)
}

/**
 * 【CSVファイル添付方式】健康保険厚生年金保険被保険者報酬月額変更届/厚生年金保険70歳以上被用者月額変更届
 * 昇(降)給区分: '1'(昇給)、'2'(降給)の何れかであること
 */
const salaryTypes = [
  { label: '該当しない', value: '0', },
  { label: '昇給', value: '1', },
  { label: '降給', value: '2', },
]
</script>

<template>
  <el-card class="edit-card">
    <template #header>
      <div class="card-header">
        {{ title }}
        <el-button type="primary" @click="handleSave" :disabled="readonly">
          備考・随時改定データ保存
        </el-button>
      </div>
    </template>

    <div class="edit-form">
      <div class="row">
        <div class="label">改定年月</div>
        <div class="field">
          <el-date-picker
            v-model="model.revisionYearMonth"
            type="month"
            format="YYYY-MM"
            value-format="YYYYMM"
            placeholder="改定年月"
            class="full-width"
            :disabled="readonly"
          />
        </div>
      </div>

      <div class="row">
        <div class="label">昇（降）給区分</div>
        <div class="field">
          <el-select
            v-model="model.salaryType"
            placeholder="選択"
            class="full-width"
            clearable
            :disabled="readonly"
          >
            <el-option
              v-for="item in salaryTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>

      <div class="row">
        <div class="label">昇（降）給額</div>
        <div class="field">
          <el-input
            v-model="model.salaryAmount"
            class="full-width"
            @blur="normalizeNumericField('salaryAmount')"
            :disabled="readonly"
          >
            <template #prefix>¥</template>
          </el-input>
        </div>
      </div>

      <div class="row">
        <div class="label">昇（降）給年月</div>
        <div class="field">
          <el-date-picker
            v-model="model.salaryYearMonth"
            type="month"
            format="YYYYMM"
            value-format="YYYYMM"
            placeholder="選択年月"
            class="full-width"
            :disabled="readonly"
          />
        </div>
      </div>

      <div class="row">
        <div class="label">昇給・降給の理由</div>
        <div class="field">
          <el-input
            v-model="model.salaryReason"
            placeholder="入力可能です"
            class="full-width"
            :disabled="readonly"
          />
        </div>
      </div>

      <div class="row">
        <div class="label">遡及支払額</div>
        <div class="field">
          <el-input
            v-model="model.retroactivePaymentAmount"
            class="full-width"
            @blur="normalizeNumericField('retroactivePaymentAmount')"
            :disabled="readonly"
          >
            <template #prefix>¥</template>
          </el-input>
        </div>
      </div>

      <div class="row">
        <div class="label">遡及支払月</div>
        <div class="field">
          <el-date-picker
            v-model="model.retroactivePaymentYearMonth"
            type="month"
            format="YYYYMM"
            value-format="YYYYMM"
            placeholder="選択年月"
            class="full-width"
            :disabled="readonly"
          />
        </div>
      </div>

      <div class="row">
        <div class="label">修正平均額</div>
        <div class="field">
          <el-input
            v-model="model.correctedAverageAmount"
            class="full-width"
            :readonly="readonlyCorrectedAverageAmount"
            @blur="normalizeNumericField('correctedAverageAmount')"
            :disabled="readonly"
          >
            <template #prefix>¥</template>
          </el-input>
        </div>
      </div>

      <div class="remarks-title">備考</div>

      <div class="checkbox-area">
        <el-checkbox v-model="model.noteOver70" :disabled="readonly">
          70歳以上被雇用者
        </el-checkbox>

        <el-checkbox v-model="model.noteMultipleJobs" :disabled="readonly">
          二以上勤務
        </el-checkbox>

        <el-checkbox v-model="model.noteShortTimeWorker" :disabled="readonly">
          短時間労働者
        </el-checkbox>

        <el-checkbox v-model="model.noteHealthInsuranceOnly" :disabled="readonly">
          健康保険のみ月額変更
        </el-checkbox>

        <div class="other-row">
          <div class="other-label">その他</div>
          <el-input
            v-model="model.noteOther"
            placeholder="入力可能です"
            class="other-input"
            :disabled="readonly"
          />
        </div>
      </div>
<!-- 
      <div class="action-row">
        <el-button type="success" @click="handleRecalculate">
          再計算
        </el-button>
      </div> -->
    </div>
  </el-card>
</template>

<style scoped>
.edit-card {
  width: 100%;
  max-width: 420px;
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

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-top: 1px solid #dcdfe6;
  font-size: .9em;
}

.row {
  display: grid;
  grid-template-columns: 150px 1fr;
  align-items: center;
  min-height: 40px;
  border-bottom: 1px solid #dcdfe6;
}

.label {
  padding: 4px 12px;
  font-weight: 500;
  color: #303133;
  background: #fafafa;
}

.field {
  padding: 4px 10px;
  display: flex;
  align-items: center;
}

.full-width {
  width: 100%;
}

.remarks-title {
  padding: 12px;
  font-weight: 700;
  color: #303133;
}

.checkbox-area {
  /* padding: 4px 12px 12px 12px; */
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.other-row {
  display: grid;
  grid-template-columns: 56px 1fr;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.other-label {
  text-align: right;
  font-weight: 600;
  color: #303133;
}

.other-input {
  width: 100%;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0 0 0;
}
</style>