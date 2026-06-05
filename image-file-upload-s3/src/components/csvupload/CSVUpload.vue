<script setup>
import { ref, computed, reactive } from 'vue'
import { useStorage } from '@vueuse/core'
import { useCSVUploadStore } from '@/components/csvupload/stores/CSVUploadStore'
import AgGridDataBrowser from '@/components/helper/grid/AgGridPro.vue'
import { useAppConfigStore } from '@/stores/AppConfigStore'

// import iconv from 'iconv-lite'
import Encoding from 'encoding-japanese'
import Papa from 'papaparse'

const configStore = useAppConfigStore()
configStore.loadFromWindow()

const agGridHandler = ref(null)

const props = defineProps({
  data_type: {
    type: String,
    required: false,
    default: 'payroll_online_csv_upload',
  },
  user_id: {
    type: String,
    required: false,
    default: 'sysadmin',
  },
  title: {
    type: String,
    required: false,
    default: 'CSV',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const openCSV = defineModel('openCSV', { type: Boolean, required: true })

const csvStore = useCSVUploadStore()

const fullScreen = ref(false)

const csvData = ref([])
const headers = ref([])

const selectedFile = ref([])
const fileInputRef = ref(null)
const fileForm = ref(null)

const currentMonthToPayroll = ref(true)

let csvDataForSave = []

const MAX_ROWS_PERMITTED = computed(
  () => configStore.PAYROLL_MAIN_CONFIG?.MAX_ROWS_PERMITTED
)

const init = reactive({
  selectedEncoding: 'UTF-8',
  show_company: true,
  show_comment: true,
  maxRows: MAX_ROWS_PERMITTED.value || 2000,
})

const state = useStorage('file-upload-local-storage', init)

const data_type_list = [
  { title: '1: 変動項目', value: 1 },
  { title: '2: デフォルト値', value: 2 },
  { title: '3: 賞与', value: 3 },
  { title: '4: その他', value: 4 },
]

const additionals = reactive({
  company_code: '0001',
  csv_comment: '',
  data_type: props.data_type ? props.data_type : '1',
  login_staff: props.user_id,
})

const currentFile = ref(null)

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  currentFile.value = file
  additionals.csv_comment = file.name

  parseCsv(file)
}

function parseCsv(file) {
  const reader = new FileReader()

  reader.onload = async () => {
    const fileContent = reader.result

    const bytes = new Uint8Array(fileContent)
    // const convertedData = iconv.decode(bytes, state.value.selectedEncoding)

    const unicodeArray = Encoding.convert(bytes, {
      to: 'UNICODE',
      from: state.value.selectedEncoding,
    })

    const convertedData = Encoding.codeToString(unicodeArray)

    Papa.parse(convertedData, {
      complete: (result) => {
        headers.value = (result.meta.fields || []).filter(
          h => (h ?? '').trim() !== ''
        )

        const max =
          Number(state.value.maxRows) > 0
            ? Number(state.value.maxRows)
            : 0

        const rows = Array.isArray(result.data) ? result.data : []
        const limitedRows = max > 0 ? rows.slice(0, max) : rows

        csvData.value = limitedRows

        csvDataForSave = limitedRows.map((row, index) => {
          const item = { ...(row || {}) }

          if (Object.prototype.hasOwnProperty.call(item, '')) {
            delete item['']
          }

          return {
            meta_data: item,
            u_index: index + 1,
          }
        })

        if (max > 0 && rows.length > max) {
          console.warn(`CSV rows truncated: ${rows.length} -> ${max}`)
        }
      },
      header: true,
      skipEmptyLines: true,
    })
  }

  reader.readAsArrayBuffer(file)
}

const toggleFullScreen = () => {
  fullScreen.value = !fullScreen.value
}

const save = async () => {
  await csvStore.save(csvDataForSave, {
    app_id: 'payroll_main',
    staff_id: 'sysadmin',
    company_code: additionals.company_code,
    csv_comment: additionals.csv_comment,
    data_type: additionals.data_type,
    login_staff: additionals.login_staff,
    adopt_current_month_to_salary: currentMonthToPayroll.value ? '1' : '0',
  })
}

const reset = () => {
  if (fileForm.value) {
    fileForm.value.reset()
  }

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }

  csvData.value = []
  headers.value = []
  currentFile.value = null

  Object.assign(state.value, init)
}

const closeDialog = () => {
  openCSV.value = false
  reset()
}

const newTitle = computed(() => {
  return `給与計算関連データのCSVアップロード(最大:${init.maxRows}行まででアップください。)`
})
</script>

<template>
  <div class="csv-upload-root">
    <v-btn
      color="success"
      prepend-icon="mdi-upload"
      :disabled="disabled"
      title="変動CSVデータを取り込みします。"
      @click="openCSV = true"
    >
      {{ title }}
    </v-btn>

    <v-dialog
      v-model="openCSV"
      :fullscreen="fullScreen"
      :max-width="fullScreen ? undefined : '70%'"
      scrollable
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-subtitle-1 font-weight-bold">
            {{ newTitle }}
          </span>

          <v-btn
            icon="mdi-close"
            variant="text"
            @click="closeDialog"
          />
        </v-card-title>

        <v-divider />

        <v-card-text>
          <div class="card-header">
            <v-form ref="fileForm">
              <v-select
                v-show="false"
                v-model="additionals.data_type"
                :items="data_type_list"
                title="アップロードデータ種類"
                placeholder="アップロードデータ種類"
                density="compact"
                variant="outlined"
                style="width: 12em; margin-right: 8px;"
              />

              <input
                ref="fileInputRef"
                type="file"
                :value="selectedFile"
                accept=".csv"
                style="margin-top: 4px;"
                @change="handleFileUpload"
              />

              <v-select
                v-model="state.selectedEncoding"
                :items="['UTF-8', 'Shift_JIS']"
                title="アップロードするファイルのエンコーディングを選択下さい！"
                placeholder="エンコーディング"
                density="compact"
                variant="outlined"
                hide-details
                style="width: 9em; margin-right: 8px;"
              />

              <v-checkbox
                v-model="state.show_comment"
                label="説明追加"
                density="compact"
                hide-details
              />

              <v-tooltip
                text="取り込みCSVデータに今月のデータを給与計算に適用するかどうか指定します。"
                location="bottom"
              >
                <template #activator="{ props: tooltipProps }">
                  <v-checkbox
                    v-bind="tooltipProps"
                    v-model="currentMonthToPayroll"
                    label="当月データを給与計算に反映します"
                    density="compact"
                    hide-details
                  />
                </template>
              </v-tooltip>
            </v-form>

            <span
              v-if="csvData.length > 0"
              class="row-count"
            >
              行数：{{ csvData.length - 1 }} + 1
            </span>

            <v-btn
              v-if="fullScreen"
              icon="mdi-crosshairs-gps"
              color="primary"
              title="ポップアップ画面を縮小して表示"
              @click="toggleFullScreen"
            />

            <v-btn
              v-else
              icon="mdi-fullscreen"
              color="warning"
              title="ポップアップ画面を全画面に表示"
              @click="toggleFullScreen"
            />

            <v-btn
              icon="mdi-refresh"
              color="error"
              title="データをリセットする"
              @click="reset"
            />

            <v-btn
              color="error"
              prepend-icon="mdi-upload"
              @click="save"
            >
              保存
            </v-btn>

            <v-btn
              color="warning"
              prepend-icon="mdi-close-bold"
              style="margin-right: 28px;"
              @click="closeDialog"
            >
              閉じる
            </v-btn>
          </div>

          <v-row class="mt-2">
            <v-col cols="12" md="6">
              <v-text-field
                v-show="state.show_comment"
                v-model="additionals.csv_comment"
                label="コメント"
                density="compact"
                variant="outlined"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="6">
              <span v-if="currentFile">
                CSVファイル名:
                <b>{{ currentFile.name }}</b>
              </span>
            </v-col>
          </v-row>

          <div
            v-if="csvData"
            class="table-responsive"
          >
            <AgGridDataBrowser
              v-if="csvData"
              ref="agGridHandler"
              height="96%"
              :rowData="csvData"
            />
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.csv-upload-root {
  display: flex;
  align-items: center;
  margin-left: 12px;
  margin-top: 4px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.card-header form {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.row-count {
  font-size: 0.9em;
  color: rgb(165, 42, 77);
}

.table-responsive {
  height: calc(100vh - 400px);
  overflow: scroll;
  width: 100%;
  overflow-x: auto;
  margin-top: 12px;
}
</style>
