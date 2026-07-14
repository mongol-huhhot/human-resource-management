<!-- StaffList.vue -->
<script setup>
import {
  onMounted,
  watch,
  nextTick,
  ref,
  computed,
} from 'vue'

import dayjs from 'dayjs'

import { useDataStore } from '@/stores/DataStore'
import { useAppConfigStore } from '@/stores/AppConfigStore'
import CSVUpload from '@/components/csvupload/CSVUpload.vue'
import AgGridDataBrowser from '@/components/helper/grid/PagedAgGridCard.vue'
import { parseAndFlattenJsonbFields } from '@/composables/utilFactory'
import Encoding from 'encoding-japanese'

const agGridHandler = ref(null)

const dataStore = useDataStore()

const configStore = useAppConfigStore()
configStore.loadFromWindow()

const showDeleted = ref(false)
const selectedVisibleColumnCount = ref(0)

const salaryDay = '20'
  
const subMonth = -1

// const companyCode = '0001'

// const targetTable = ref('payroll')

const rows = ref([])

const notificationFileName = 'SHFD0006.CSV'

const START_YEARMONTH = '2026-02-01'
const START_YEARMONTH_NO = 96

const openCSV = ref(false)

const filteredCount = computed(
  () => agGridHandler.value?.filteredRowCount
)

const approved_status = computed(() =>
  (rows.value ?? []).some(
    row => row?.approved_status === true
  )
)

dataStore.states.approved_status = computed(
  () => approved_status.value
)

const approvedMessage = computed(() =>
  dataStore.states.approved_status
    ? '届済'
    : '未届'
)

const isOperatable = computed(() =>
  configStore.MAIN_CONFIG
    ?.includes(dayjs().month())
)

const readOnly = computed(() => {
  if (
    configStore.MAIN_CONFIG?.debug_mode
  ) {
    return false
  }

  if (
    isOperatable.value &&
    !dataStore.states.approved_status
  ) {
    return false
  }

  return true
})

watch(
  () => agGridHandler.value?.selectedVisibleColumnCount?.value,
  (v) => {
    selectedVisibleColumnCount.value = v ?? 0
  },
  {
    immediate: true,
  }
)

const loadData = async () => {
  let val = await dataStore.get_staff_profile({
    category_code: 'staffs'
  })
  val = val?.[0]?.result || []
  rows.value = parseAndFlattenJsonbFields(val, ['profile_jsonb'])
  await nextTick()
}

onMounted(async () => {
  pickedDate.value = dayjs()
    .add(subMonth, 'month')
    .format(`YYYY-MM`)
})

const pickedDate = ref(null)

watch(
  () => pickedDate.value,
  (val) => {
    if (!val) return

    const normalized = dayjs(val)
      .date(salaryDay)
      .format('YYYY-MM-DD')

    if (
      dataStore.states.current_month !== normalized
    ) {
      dataStore.states.current_month = normalized
    }
  }
)

watch(
  () => dataStore.states.current_month,
  async (newVal, oldVal) => {
    if (!newVal) return
    if (newVal === oldVal) return

    try {
      await loadData()
    } catch (e) {
      console.log(e)
    }
  }
)

watch(
  () => dataStore.states.forceFresh,
  async (newVal, oldVal) => {
    if (!newVal) return
    if (newVal === oldVal) return

    try {
      await loadData()
    } catch (e) {
      console.log(e)
    }
  }
)

const handleRowClick = (event) => {
  dataStore.states.currentRow = event.data
}

const gridColumns = computed(() => {
  return dataStore.buildColumnsDefine(
    (p) => dataStore.rowCliked(p)
  )
})

watch(
  () => showDeleted.value,
  async () => {
    await getSalaryList()
  }
)

const getSerialNo = () => {
  const d1 = dayjs(START_YEARMONTH)
  const d2 = dayjs(pickedDate.value)

  const diffMonths = d2.diff(d1, 'month')

  return START_YEARMONTH_NO + diffMonths
}

const toCsv = (rows) => {
  if (!rows.length) return ''

  return rows
    .map(row =>
      Object.values(row)
        .map(v =>
          `"${String(v ?? '').replace(/"/g, '""')}"`
        )
        .join(',')
    )
    .join('\n')
}

const getCSV = (sourceRows) => {
  const normalizedRows = sourceRows
    .map(el => {
      let v = el?.change_notification

      if (typeof v === 'string') {
        try {
          v = JSON.parse(v)
        } catch (e) {
          console.error(e, el)
          return null
        }
      }

      return v
    })
    .filter(
      v =>
        v &&
        typeof v === 'object' &&
        !Array.isArray(v)
    )

  const csv = toCsv(normalizedRows)

  const current_serial_no = getSerialNo()

  const finalCSV = [
    `21,14,ﾌﾑｷ,${current_serial_no},${pickedDate.value},22223`,
    '[kanri]',
    ',001',
    '21,14,ﾌﾑｷ,69192,105,1,東京都港区虎ノ門三丁目22番1号虎ノ門桜ビル5F,フジ産業株式会社,山下　剛,3,3434,8901',
    '[data]',
    ...(csv ? csv.split('\n') : []),
  ]

  return finalCSV.join('\n')
}

const downloadCSV = (
  csv,
  filename = 'data.csv'
) => {
  const sjisArray = Encoding.convert(csv, {
    to: 'SJIS',
    from: 'UNICODE',
    type: 'array',
  })

  const uint8Array = new Uint8Array(sjisArray)

  const blob = new Blob(
    [uint8Array],
    {
      type: 'text/csv',
    }
  )

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = url
  link.download = filename

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

function showMessage(type, text) {
  console.log(type, text)
}

async function handleDownload() {
  const ret =
    await dataStore.get_change_notification({
      yearmonth: pickedDate.value,
    })

  if (!ret || ret.length === 0) {
    showMessage(
      'info',
      '月額変更届データはありません！'
    )

    return
  }

  const csv = getCSV(ret)

  downloadCSV(
    csv,
    notificationFileName
  )

  if (
    !approved_status.value ||
    configStore.MAIN_CONFIG?.debug_mode
  ) {
    await dataStore.approve_change_notification({
      approved_status: true,
      user_id:
        dataStore.params?.attributes?.user_id,
      yearmonth: pickedDate.value,
    })
  }
}

</script>

<template>
  <v-card class="card_box">
    <v-card-title>
      <div class="d-flex align-center flex-wrap ga-3">
        <h4>
          個人情報管理
        </h4>

        <a
          href="https://surupas.native365.net/jfsg230540/webcomponents/jfsg230540/chart-system/?k=retroactive"
          target="_blank"
          class="help_link"
        >
          操作手順・説明書はこちら
        </a>
      </div>
    </v-card-title>

    <v-card-text>
      <div
        class="box_header"
        style="margin-top:0px; margin-bottom:12px;"
      >
        <v-text-field
          v-model="pickedDate"
          type="month"
          label="年月"
          density="compact"
          variant="outlined"
          hide-details
          style="width:10em; margin-top:4px; margin-right:12px;"
        />

        <div class="box_header">
          <CSVUpload
            v-model:openCSV="openCSV"
            title="変動データCSV"
            :disabled="readOnly"
          />

          <v-tooltip
            text="随時改定（月額変更届）データ出力します。出力は複数回可能ですが、月額データ更新は不可になります！"
            location="bottom"
          >
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                color="warning"
                prepend-icon="mdi-download"
                style="margin-left:1dvh; margin-top:4px;"
                @click="handleDownload"
              >
                月額変更届
              </v-btn>
            </template>
          </v-tooltip>
        </div>

        <v-chip
          v-if="approvedMessage === '届済'"
          color="success"
          style="margin-top:8px; margin-left:12px;"
        >
          {{ approvedMessage }}
        </v-chip>

        <v-chip
          v-else
          color="error"
          style="margin-top:8px; margin-left:12px;"
        >
          {{ approvedMessage }}
        </v-chip>
      </div>

      <AgGridDataBrowser
        v-if="rows"
        ref="agGridHandler"
        :rowData="rows"
        :columns="gridColumns"
        height="calc(100vh - 310px)"
        @row-click="handleRowClick"
      />
    </v-card-text>
  </v-card>
</template>

<style scoped>
h4 {
  padding: 0;
  margin: 8px 20px 0 0 !important;
}

.comment_class {
  margin-top: 10px;
  margin-left: 12px;
  font-size: 0.71em;
}

.box_header {
  padding: 0 !important;
  margin-left: 8px !important;
  display: flex;
  justify-content: left;
  align-items: center;
  flex-wrap: wrap;
}

.help_link {
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-left: 12px;
}
</style>