<!-- PayrollProrationEditor.vue -->
<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import {
    ElMessage,
    ElMessageBox,
    ElDialog,
    ElCard,
    ElForm,
    ElFormItem,
    ElInput,
    ElDatePicker,
    ElRow,
    ElCol,
    ElDescriptions,
    ElDescriptionsItem,
    ElTable,
    ElTableColumn,
    ElSelect,
    ElOption,
    ElInputNumber,
    ElButton,
    ElTag
} from 'element-plus'

import { useRetroactiveStore } from '@/stores/DataStore'

const openDialog = defineModel({
  type: Boolean,
  default: false,
})

const payrollStore = useRetroactiveStore()

// ---- model ----
const form = ref({
  staff: {
    staff_id: payrollStore.states.currentRow?.staff_id || '12345',
    staff_code: payrollStore.states.currentRow?.staff_code || '12345',
    staff_name: payrollStore.states.currentRow?.staff_name || '山田 太郎',
    // induction_date: payrollStore.states.currentRow?.induction_date || '1979-01-21',  
    // resignation_date: payrollStore.states.currentRow?.resignation_date || null,
  },
  yearmonth: dayjs().format('YYYYMM'),
  salary_amount: 0, // 期間内の合計給与額（勤怠と単価から計算して保存する想定）

  // 入社/退職/変更のイベント（任意）
  lifecycle: {
    join_date: payrollStore.states.currentRow?.induction_date || '1979-01-21',  // 'YYYY-MM-DD'
    leave_date: payrollStore.states.currentRow?.resignation_date || null, // 'YYYY-MM-DD'
  },

  // レート期間（核心）
    rateSegments: [
    {
        id: crypto.randomUUID(),
        from: dayjs().startOf('month').format('YYYY-MM-DD'),
        to: dayjs().startOf('month').add(14, 'day').format('YYYY-MM-DD'),
        pay_type: 'hourly',
        unit_price: 2000,
        prorate_basis: 'minutes',
        note: '単価変更（前半）',

        // ✅ new item
        work_days: 0, // 勤怠日数（期間内の出勤日数など）
        worked_minutes: 0, // 勤怠分数（期間内の実働分数など）
        salary_amount: 0, // 期間内の給与額（勤怠と単価から計算して保存する想定）
    },
    {
        id: crypto.randomUUID(),
        from: dayjs().startOf('month').add(15, 'day').format('YYYY-MM-DD'),
        to: dayjs().endOf('month').format('YYYY-MM-DD'),
        pay_type: 'hourly',
        unit_price: 2800,
        prorate_basis: 'minutes',
        note: '単価変更（後半）',

        // ✅ new item
        work_days: 0,
        worked_minutes: 0, // 勤怠分数（期間内の実働分数など）
        salary_amount: 0, // 期間内の給与額（勤怠と単価から計算して保存する想定）
    },
  ],

  // 勤怠集計（UI例：日別/合計どちらでもOK。ここでは月合計だけ置く）
  attendance: {
    scheduled_days: payrollStore.states.currentRow?.J8060 || 0,  // 所定労働日数（例: 20日）
    worked_days: payrollStore.states.currentRow?.J150 || 0,    // 実働日数（例: 18日）
    scheduled_minutes: payrollStore.states.currentRow?.J8050 || 0, //   所定労働分数（例: 160h=9600m） 
    worked_minutes: payrollStore.states.currentRow?.JE080 || 0,    //   実働分数（例: 144h=8640m）
    overtime_minutes: payrollStore.states.currentRow?.JE090 || 0,   // 10h
    late_minutes: payrollStore.states.currentRow?.JA410 || 0,
    absent_days: payrollStore.states.currentRow?.J149 || 0,
  },

  // 控除は “通常計算” 側で合算して計算する前提で、ここでは表示だけ
  deductionsPolicy: {
    income_tax: 'normal',     // normal
    employment_insurance: 'normal',
    resident_tax: 'fixed',    // fixed / special_case
    social_insurance: 'monthly_judgement', // monthly_judgement (資格判定)
  }
})

// ---- helpers ----
const monthStart = computed(() => dayjs(form.value.yearmonth + '01').add(-1, 'M').format('YYYY-MM-21'))
const monthEnd = computed(() => dayjs(form.value.yearmonth + '01').endOf('month').format('YYYY-MM-20'))

function addSegment() {
  form.value.rateSegments.push({
    id: crypto.randomUUID(),
    from: monthStart.value,
    to: monthEnd.value,
    pay_type: 'hourly',
    unit_price: 0,
    prorate_basis: 'minutes',
    note: '',

    // ✅ new item
    work_days: 0,
  })
}

async function removeSegment(id) {
  const ok = await ElMessageBox.confirm('この期間を削除しますか？', '確認', {
    confirmButtonText: '削除',
    cancelButtonText: 'キャンセル',
    type: 'warning',
  }).catch(() => false)
  if (!ok) return
  form.value.rateSegments = form.value.rateSegments.filter(s => s.id !== id)
}

function normalizeSegments() {
  // simple validation: from <= to, within month
  for (const s of form.value.rateSegments) {
    if (!s.from || !s.to) throw new Error('期間(from/to)は必須です')
    if (dayjs(s.from).isAfter(dayjs(s.to))) throw new Error('from は to より前にしてください')
    if (s.unit_price == null || Number(s.unit_price) < 0) throw new Error('単価は0以上で入力してください')
  }
}

// ---- preview calculation (demo) ----
// NOTE: In real payroll, you should intersect daily/clock records with segments.
// Here we approximate worked minutes split by date share across segments.
const previewRows = computed(() => {
  try {
    normalizeSegments()
  } catch {
    return []
  }

  const worked = Number(form.value.attendance.worked_minutes || 0)
  const overtime = Number(form.value.attendance.overtime_minutes || 0)

  // allocate minutes by number of days in each segment (rough preview)
  const segments = form.value.rateSegments.map(s => {
    const d1 = dayjs(s.from)
    const d2 = dayjs(s.to)
    const days = d2.diff(d1, 'day') + 1
    return { ...s, days }
  })

  const totalDays = segments.reduce((a, b) => a + b.days, 0) || 1

  return segments.map(s => {
    const ratio = s.days / totalDays
    const segWorkedMin = Math.round(worked * ratio)
    const segOtMin = Math.round(overtime * ratio)

    const hourly = (s.pay_type === 'hourly')
      ? Number(s.unit_price)
      : (s.pay_type === 'daily')
        ? (Number(s.unit_price) / 8) // demo: 1日=8h換算
        : (Number(s.unit_price) / (160)) // demo: 月給→時給換算(160h)

    const basePay = Math.floor((segWorkedMin / 60) * hourly)
    const otPay = Math.floor((segOtMin / 60) * hourly * 1.25) // demo: 25%割増

    return {
      id: s.id,
      period: `${s.from} 〜 ${s.to}`,
      pay_type: s.pay_type,
      unit_price: Number(s.unit_price),
      worked_h: (segWorkedMin / 60).toFixed(2),
      overtime_h: (segOtMin / 60).toFixed(2),
      basePay,
      otPay,
      amount: basePay + otPay,
      note: s.note || ''
    }
  })
})

function ensureSegmentFields() {
  for (const s of form.value.rateSegments) {
    if (s.work_days == null) s.work_days = 0
  }
}
ensureSegmentFields()

const previewTotals = computed(() => {
  const rows = previewRows.value
  const base = rows.reduce((a, r) => a + r.basePay, 0)
  const ot = rows.reduce((a, r) => a + r.otPay, 0)
  return {
    base,
    ot,
    gross: base + ot
  }
})

function saveDraft() {
  // replace with API/store save
  ElMessage.success('下書きを保存しました（デモ）')
}

function runCalc() {
  // replace with API that returns real calculation preview
  ElMessage.success('計算プレビューを更新しました')
}
</script>

<template>
    <el-dialog v-model="openDialog" width="calc(100% - 80px)" :destroy-on-close="true" top="5vh">
        <template #header>
            <div style="font-weight:700; font-size:18px; color: --janga_color;">個別計算エディタ</div>
        </template>

        <!-- {{ payrollStore.states.currentRow }} -->
         <!-- Contentは前述のコード全体をここに入れる -->
         <!-- <div style="padding:16px; display:flex; flex-direction:column; gap:16px;"> -->
           <!-- ここに前述のコード全体を配置 -->
         <!-- </div> -->
        <div style="display:flex; flex-direction:column; gap:8px;">
            <!-- Header -->
            <el-card shadow="never">
                <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                    <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
                    <div style="font-weight:700; font-size:16px;">個別計算（途中入社/退職/単価変更）</div>
                    <el-tag type="info">Surupas v5</el-tag>
                    </div>
                    <div style="display:flex; gap:8px;">
                    <el-button @click="saveDraft">下書き保存</el-button>
                    <el-button type="primary" @click="runCalc">プレビュー計算</el-button>
                    </div>
                </div>
            </el-card>

            <!-- Staff & Month -->
            <el-row :gutter="16">
                <el-col :xs="24" :md="12">
                    <el-card shadow="never">
                    <template #header>
                        <div style="font-weight:700;">対象情報</div>
                    </template>

                    <el-form label-width="110px" label-position="left">
                        <el-form-item label="給与年月">
                        <el-input v-model="form.yearmonth" placeholder="YYYYMM" style="max-width:160px;" />
                        <el-tag style="margin-left:10px;" type="success">
                            {{ monthStart }} 〜 {{ monthEnd }}
                        </el-tag>
                        </el-form-item>

                        <el-form-item label="スタッフ">
                        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                            <el-tag type="info">{{ form.staff.staff_code }}</el-tag>
                            <span style="font-weight:600;">{{ form.staff.staff_name }}</span>
                            <span style="color:#888;">({{ form.staff.staff_id }})</span>
                        </div>
                        </el-form-item>

                        <el-form-item label="入社日(任意)">
                        <el-date-picker
                            v-model="form.lifecycle.join_date"
                            type="date"
                            value-format="YYYY-MM-DD"
                            placeholder="YYYY-MM-DD"
                            style="width: 180px;"
                        />
                        </el-form-item>

                        <el-form-item label="退職日(任意)">
                        <el-date-picker
                            v-model="form.lifecycle.leave_date"
                            type="date"
                            value-format="YYYY-MM-DD"
                            placeholder="YYYY-MM-DD"
                            style="width: 180px;"
                        />
                        </el-form-item>
                    </el-form>
                    </el-card>
                </el-col>

                <!-- Attendance Summary -->
                <el-col :xs="24" :md="12">
                    <el-card shadow="never">
                    <template #header>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-weight:700;">勤怠（集計）</div>
                        <el-tag type="warning">※ここは月合計の例</el-tag>
                        </div>
                    </template>

                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="所定(分)">
                        {{ form.attendance.scheduled_minutes }}
                        </el-descriptions-item>
                        <el-descriptions-item label="所定(時間)">
                        {{ (form.attendance.scheduled_minutes/60).toFixed(2) }}
                        </el-descriptions-item>

                        <el-descriptions-item label="実働(分)">
                        {{ form.attendance.worked_minutes }}
                        </el-descriptions-item>
                        <el-descriptions-item label="実働(時間)">
                        {{ (form.attendance.worked_minutes/60).toFixed(2) }}
                        </el-descriptions-item>

                        <el-descriptions-item label="残業(分)">
                        {{ form.attendance.overtime_minutes }}
                        </el-descriptions-item>
                        <el-descriptions-item label="残業(時間)">
                        {{ (form.attendance.overtime_minutes/60).toFixed(2) }}
                        </el-descriptions-item>
                    </el-descriptions>

                    <div style="margin-top:10px; color:#888; font-size:12px;">
                        実装では「日別/打刻」データを使い、レート期間と交差して正確に按分します。
                    </div>
                    </el-card>
                </el-col>
            </el-row>

            <!-- Rate segments -->
            <el-card shadow="never">
            <template #header>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
                <div style="font-weight:700;">単価期間（レートセグメント）</div>
                <el-button type="primary" plain @click="addSegment">＋ 期間を追加</el-button>
                </div>
            </template>

            <el-table :data="form.rateSegments" style="width:100%" border>
                <el-table-column label="期間(from〜to)" min-width="260">
                <template #default="{ row }">
                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <el-date-picker v-model="row.from" type="date" value-format="YYYY-MM-DD" style="width:140px;" />
                    <span>〜</span>
                    <el-date-picker v-model="row.to" type="date" value-format="YYYY-MM-DD" style="width:140px;" />
                    </div>
                </template>
                </el-table-column>

                <el-table-column label="勤怠日数" width="140">
                    <template #default="scope">
                        <el-input-number
                        v-if="scope?.row"
                        v-model="scope.row.work_days"
                        :min="0"
                        :step="1"
                        controls-position="right"
                        style="width:120px;"
                        />
                    </template>
                    </el-table-column>

                <el-table-column label="給与形態" width="150">
                <template #default="{ row }">
                    <el-select v-model="row.pay_type" style="width:130px;">
                    <el-option label="時給" value="hourly" />
                    <el-option label="日給" value="daily" />
                    <el-option label="月給" value="monthly" />
                    </el-select>
                </template>
                </el-table-column>

                <el-table-column label="単価" width="160">
                <template #default="{ row }">
                    <el-input-number
                    v-model="row.unit_price"
                    :min="0"
                    :step="100"
                    controls-position="right"
                    style="width:140px;"
                    />
                </template>
                </el-table-column>

                <el-table-column label="按分ルール" width="180">
                <template #default="{ row }">
                    <el-select v-model="row.prorate_basis" style="width:160px;">
                        <el-option label="分単位(時給向け)" value="minutes" />
                        <el-option label="暦日割り" value="calendar_days" />
                        <el-option label="30日割り" value="fixed_30" />
                        <el-option label="所定労働日割り" value="scheduled_workdays" />
                        <el-option label="所定時間割り" value="scheduled_hours" />
                    </el-select>
                </template>
                </el-table-column>

                <el-table-column label="メモ" min-width="180">
                <template #default="{ row }">
                    <el-input v-model="row.note" placeholder="例：昇給/降給、部署変更など" />
                </template>
                </el-table-column>

                <el-table-column label="操作" width="90" fixed="right">
                <template #default="{ row }">
                    <el-button type="danger" plain size="small" @click="removeSegment(row.id)">削除</el-button>
                </template>
                </el-table-column>
            </el-table>

            <div style="margin-top:10px; color:#888; font-size:12px;">
                ※ 実運用では「日途中の単価変更」があるなら、勤怠の開始/終了時刻（または打刻）を使って交差させます。
            </div>
            </el-card>

            <!-- Preview -->
            <el-row :gutter="16">
            <el-col :xs="24" :md="16">
                <el-card shadow="never">
                <template #header>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:700;">支給額プレビュー（期間別）</div>
                    <el-tag type="info">※簡易按分デモ</el-tag>
                    </div>
                </template>

                <el-table :data="previewRows" border style="width:100%">
                    <el-table-column prop="period" label="期間" min-width="220" />
                    <el-table-column prop="pay_type" label="形態" width="110" />
                    <el-table-column prop="unit_price" label="単価" width="110" />
                    <el-table-column prop="worked_h" label="所定内(h)" width="120" />
                    <el-table-column prop="overtime_h" label="残業(h)" width="110" />
                    <el-table-column prop="basePay" label="所定内(円)" width="140" />
                    <el-table-column prop="otPay" label="残業(円)" width="120" />
                    <el-table-column prop="amount" label="小計(円)" width="120" />
                    <el-table-column prop="note" label="メモ" min-width="140" />
                </el-table>
                </el-card>
            </el-col>

            <el-col :xs="24" :md="8">
                <el-card shadow="never">
                <template #header>
                    <div style="font-weight:700;">合計</div>
                </template>

                <el-descriptions :column="1" border>
                    <el-descriptions-item label="所定内 合計(円)">
                    {{ previewTotals.base.toLocaleString() }}
                    </el-descriptions-item>
                    <el-descriptions-item label="残業 合計(円)">
                    {{ previewTotals.ot.toLocaleString() }}
                    </el-descriptions-item>
                    <el-descriptions-item label="支給 合計(円)">
                    <span style="font-weight:700; font-size:16px;">
                        {{ previewTotals.gross.toLocaleString() }}
                    </span>
                    </el-descriptions-item>
                </el-descriptions>

                <div style="margin-top:12px; font-weight:700;">控除ポリシー（表示のみ）</div>
                <el-descriptions :column="1" border style="margin-top:6px;">
                    <el-descriptions-item label="所得税">
                    通常（課税支給合算で計算）
                    </el-descriptions-item>
                    <el-descriptions-item label="雇用保険">
                    通常（対象賃金×料率）
                    </el-descriptions-item>
                    <el-descriptions-item label="住民税">
                    原則定額（退職時は運用分岐）
                    </el-descriptions-item>
                    <el-descriptions-item label="社会保険">
                    月次資格判定（原則日割りなし）
                    </el-descriptions-item>
                </el-descriptions>
                </el-card>
            </el-col>
            </el-row>
        </div>
    </el-dialog>
</template>
