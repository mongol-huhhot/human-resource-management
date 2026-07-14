<!-- MonthlyChangeJudgePage.vue
  随時月額改定
-->
<script setup>
import {watch, ref, computed, } from 'vue'
import {ElRow, ElCol, ElMessage, } from 'element-plus'

import RetroactiveInputPage from './RetroactiveInputPage.vue'
import RetroactiveNoteEditForm from './RetroactiveNoteEditForm.vue';
import MonthlyChangeInfoCard from './MonthlyChangeInfoCard.vue';
import { useRetroactiveStore } from '@/stores/DataStore'

import { toNumber, }  from '@/composables/useUtils'
import { useAppConfigStore } from '@/stores/AppConfigStore'

const configStore = useAppConfigStore()
configStore.loadFromWindow()

const dataStore = useRetroactiveStore()

const loading = ref(false)
const saving = ref(false)

const PREFECTURE_CODE = '13'

// 遡及DBデータ
const retroactiveData = ref([])

// 遡及編集データ
const retroactiveEdited = ref({
  months: [],
})

// 月変・算定 通常給与 or 遡及後給与を参照 判定・集計 確定結果
// { remark:{}, monthly_change: {} }
const monthlyChangeData = ref({})

// 選択したスタッフデータ
const selectedRow = ref({})

// 保険等級
const hokenToukyu = ref({})

/** readonly? */
const readOnly = computed( () => {
  if( configStore.PAYROLL_MAIN_CONFIG?.debug_mode ) return false // editable
  return dataStore.states.approved_status // return 
})

// 確定
// const approved_status = ref(false)

const loadHolenToukyu = async() => {
  const ret = await dataStore.get_hokenToukyu(
    {
      staff_code: selectedRow.value.staff_code,
      salary_date:  selectedRow.value.salary_date,
      prefecture_code: PREFECTURE_CODE
    }
  )

  if( ret || ret.length > 0)
    hokenToukyu.value = ret[0]
  else 
    hokenToukyu.value = {}
}

// load data
const loadRetroactiveData = async (row) => {
  if (!row?.salary_date || !row?.staff_code) {
    retroactiveData.value = []
    monthlyChangeData.value = {}
    return
  }

  loading.value = true

  const params = {
    salary_date: row.salary_date,
    yearmonth: row.salary_date,
    staff_codes: row.staff_code,
  }

  try {
    // 1. 遡及編集データを読み込み
    const retroRes = await dataStore.get_three_month_retroactive_data(params)
    retroactiveData.value = Array.isArray(retroRes) ? retroRes : []

    // 2. 備考・月変編集データを読み込み
    let monthlyRes = await dataStore.get_monthly_change_edit_data(params)
    console.log("monthlyRes===", monthlyRes)
    if(monthlyRes && Array.isArray(monthlyRes) && monthlyRes.length > 0 )
      monthlyRes = monthlyRes[0] // one data per person(returns array value even only one value)
    let normalizedMonthlyData = {}
    normalizedMonthlyData.remark = {"isMonthlyChangeTargetConfirmed": true,"isMonthlyChangeTargetCalculated": true}
    normalizedMonthlyData.monthly_change = {revisionYearMonth: dataStore.states.currentRow?.revision_apply_month }

    if (monthlyRes && typeof monthlyRes === 'object' && !Array.isArray(monthlyRes)) {
      normalizedMonthlyData = { ...monthlyRes }
      if (
        normalizedMonthlyData.change_edit_data &&
        typeof normalizedMonthlyData.change_edit_data === 'string'
      ) {
        try {
          const parsed = JSON.parse(normalizedMonthlyData.change_edit_data)
          normalizedMonthlyData = {
            ...normalizedMonthlyData,
            ...(parsed && typeof parsed === 'object' ? parsed : {}),
          }
        } catch (parseError) {
          console.error('change_edit_data JSON parse error:', parseError)
        }

        delete normalizedMonthlyData.change_edit_data
      }
    }
    monthlyChangeData.value = normalizedMonthlyData

    // approved_status.value =  normalizedMonthlyData.monthly_change?.approved_status

    await loadHolenToukyu()

  } catch (error) {
    console.error('loadRetroactiveData error:', error)
    ElMessage.error('遡及・月変データの取得に失敗しました。')

    retroactiveData.value = []
    monthlyChangeData.value = {}
  } finally {
    loading.value = false
  }
}

const calcDeltaJ9107 = (row) => {
  console.log("calcDeltaJ9107: row====", row)
  return (
    toNumber(row.mealAmount) +
    toNumber(row.housingBenefit) +
    toNumber(row.cashReward) +
    toNumber(row.monthlyVariableAmount)
  )
}

// 遡及編集データの保存
async function handleSaveRetro() {
  const iv = retroactiveEdited.value.months.map(el => {
    el.D_J9107 = calcDeltaJ9107(el)
    return {input_values: el, yearmonth: el.salaryDate }
  })
  console.log("ivivivivi====",iv)
  const p = {
    staff_code: selectedRow.value.staff_code, 
    LOOP: iv
  }
  await dataStore.save_three_month_retroactive_data(p)

  await loadHolenToukyu()

  // スタッフ一覧を更新させる watch(salaryData.states.forceFresh)
  dataStore.states.forceFresh = '' + Math.random()
}

// 承認済み(true) or 未承認(false)
const approval = ref(false)

/*** 備考データ・.随時改定情報保存  */
async function handleSaveChange(v) {
  console.log("handleSaveChange: v===", 
      dataStore.states.currentRow, 
      hokenToukyu.value,
      v,
      approval.value,
      monthlyChangeData.value
  )

  const p = {
    staff_id: selectedRow.value.staff_id, 
    staff_code: selectedRow.value.staff_code, 
    yearmonth: selectedRow.value.salary_date, 
    change_edit_data: {
      remark: monthlyChangeData.value.remark,
      monthly_change: monthlyChangeData.value.monthly_change
    },
    result_values: dataStore.states?.currentRow,
    existing_sumary: hokenToukyu.value,
    approved_by: dataStore.params.attributes.user_id,
    approved_status: approval.value,
  }
  
  await dataStore.save_monthly_change_edit_data( p )

  // スタッフ一覧を更新させる watch(salaryData.states.forceFresh)
  dataStore.states.forceFresh = '' + Math.random()
}

function handleRetroTotalsUpdate(v) {
  console.log("totals===", v)
}

const staffName = ref('')

watch(
  () => dataStore.states?.currentRow,
  async (row) => {
    console.log('dataStore.states.currentRow 11111 === ', row)
    if (!row) return

    selectedRow.value = row;

    if(row && row.staff_code )
      staffName.value = `${row.staff_code}:${row.staff_name}`

    await loadRetroactiveData(row)
  },
  { immediate: true, deep: true }
)

</script>

<template>
  <div class="table-responsive" v-if="dataStore.states.currentRow">
    <el-row :gutter="1" class="judge-page-row">
      <!-- 左：遡及入力・変動データ編集 -->
      <el-col :xs="24" :sm="24" :md="24" :lg="13" :xl="13" class="pane-col">
        <RetroactiveInputPage
          v-if="retroactiveData"
          v-model="retroactiveEdited"
          :source-rows="retroactiveData"
          :staff-info="selectedRow"
          :loading="loading"
          :saving="saving"
          @save="handleSaveRetro"
          @update:totals="handleRetroTotalsUpdate"
          :readonly="readOnly"
        />
      </el-col>
      <!-- 右：備考 -->
      <el-col :xs="24" :sm="24" :md="24" :lg="11" :xl="11" class="pane-col">
        <RetroactiveNoteEditForm
          v-if="monthlyChangeData?.monthly_change"
          v-model="monthlyChangeData.monthly_change"
          @save="handleSaveChange"
          :readonly="readOnly"
        ></RetroactiveNoteEditForm>
      </el-col>
    </el-row>
    
    <el-row>
      <el-col>
        <MonthlyChangeInfoCard
          v-if="monthlyChangeData?.remark && dataStore.states?.currentRow"
          :staff-name="staffName"
          v-model="monthlyChangeData.remark"
          :hoken_toukyu="hokenToukyu"
          :is_monthly_change_candidate="dataStore.states?.currentRow?.is_monthly_change_candidate"
          :readonly="readOnly"
        ></MonthlyChangeInfoCard>
      </el-col>
    </el-row>
  </div>
  <div v-else>スタッフ選択なし。左の一覧から選んで編集します！</div>
</template>

<style scoped>

.table-responsive {
  height: calc(100vh - 280px);
  overflow: scroll;
  width: 100%;
  overflow-x: auto;
  margin-bottom: 8px;
}

/* カスタムスクロールバー（オプション） */
.scrollable-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scrollable-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.scrollable-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.scrollable-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.judge-page-row {
  width: 100%;
  margin: 0 !important;
}

.pane-col {
  min-width: 0;
  display: flex;
  margin-bottom: 14px;
}

.pane-card {
  width: 100%;
  min-width: 0;
}

.left-pane,
.right-pane {
  height: 100%;
}

@media (max-width: 1200px) {
  .pane-col {
    margin-bottom: 14px;
  }
}
</style>
