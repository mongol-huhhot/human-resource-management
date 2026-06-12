<script setup>
import { ref, computed, reactive, } from 'vue'
import { useStorage } from '@vueuse/core'
import { ElDialog, ElButton, ElSelect, ElOption, ElInput, ElCheckbox, ElRow, ElCol, ElForm, ElFormItem, ElTooltip, } from 'element-plus'
import { useCSVUploadStore } from  '@/components/helper/csvupload/stores/CSVUploadStore'
import AgGridDataBrowser from '@/components/helper/grid/AgGridPro.vue'
import { CloseBold,  FullScreen, Aim, UploadFilled, RefreshLeft, Upload, } from '@element-plus/icons-vue'
import { useAppConfigStore } from '@/stores/AppConfigStore'

import iconv from 'iconv-lite';
import Papa from 'papaparse';

const configStore = useAppConfigStore()
configStore.loadFromWindow()

const agGridHandler = ref(null);

const props = defineProps({
  data_type: {
    type: String,
    required: false,
    default: 'payroll_online_csv_upload',
  },
  user_id: {
    type: String,
    required: false,
    default: 'sysadmin'
  },
  title: {
    type: String,
    required: false,
    default: 'CSV'
  },
  disabled: {
    type: Boolean,
    default: false,
  }

})

const openCSV = defineModel('openCSV', { type: Boolean, required: true})

const csvStore = useCSVUploadStore();

const fullScreen = ref(false)

const csvData = ref([])
const headers = ref([])

const selectedFile = ref([])
const fileInputRef = ref(null)
const fileForm = ref(null);

const currentMonthToPayroll = ref( true ) // true: する, false: しない

let csvDataForSave = []

const MAX_ROWS_PERMITTED = computed(() => configStore.PAYROLL_MAIN_CONFIG?.MAX_ROWS_PERMITTED )

const init = reactive({
    selectedEncoding: "UTF-8",
    show_company: true,
    show_comment: true,
    maxRows: MAX_ROWS_PERMITTED.value||2000,  // ★追加：一度に処理する最大行数（ヘッダ除く想定）
})


const state = useStorage('file-upload-local-storage', init)

const data_type_list = [
    { label:'1: 変動項目', value: 1},
    { label:'2: デフォルト値', value: 2},
    { label:'3: 賞与', value: 3},
    { label:'4: その他', value: 4},
]

const additionals = reactive({
    company_code: '0001',
    csv_comment: '',
    data_type: props.data_type?props.data_type:'1',
    login_staff: props.user_id
})

const currentFile = ref(null)

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    currentFile.value = file

    additionals.csv_comment = file.name

    // console.log(file)
    parseCsv(file)
}

function parseCsv(file) {
  const reader = new FileReader();

  reader.onload = async () => {
    const fileContent = reader.result;

    const bytes = new Uint8Array(fileContent);
    const convertedData = iconv.decode(bytes, state.value.selectedEncoding)

    Papa.parse(convertedData, {
      complete: (result) => {
        // ヘッダ
        headers.value = (result.meta.fields || []).filter(h => (h ?? '').trim() !== '');

        // ★ 最大行数（ヘッダ行は除く想定。Papa.parse(header:true) の result.data は「データ行」）
        const max = Number(state.value.maxRows) > 0 ? Number(state.value.maxRows) : 0;

        const rows = Array.isArray(result.data) ? result.data : [];
        const limitedRows = max > 0 ? rows.slice(0, max) : rows;

        csvData.value = limitedRows;

        // 保存用（表示と同じ範囲だけ作る）
        csvDataForSave = limitedRows.map((row, index) => {
          const item = { ...(row || {}) };

          // 空キー削除（Papaparseが作ることがある）
          if (Object.prototype.hasOwnProperty.call(item, '')) delete item[''];

          return { meta_data: item, u_index: index + 1 };
        });

        // 行数が切り捨てられた通知（任意）
        if (max > 0 && rows.length > max) {
          console.warn(`CSV rows truncated: ${rows.length} -> ${max}`);
        }
      },
      header: true,
      skipEmptyLines: true,
    });
  };

  reader.readAsArrayBuffer(file);
}

// toggle full screen mode
const toggleFullScreen = () => fullScreen.value = !fullScreen.value

// save upload csv file
const save = async () => {
    await csvStore.save(csvDataForSave, {
        app_id:'payroll_main', 
        staff_id:'sysadmin', 
        company_code:additionals.company_code, 
        csv_comment: additionals.csv_comment, 
        data_type: additionals.data_type,
        login_staff: additionals.login_staff,
        adopt_current_month_to_salary: currentMonthToPayroll.value ? '1' : '0' // 関数側が文字列0/1で受け取る想定のため、'1' or '0' に変換して渡す
    })
}

// reset upload file
const reset = () => {
    if( !fileForm.value ) 
        return

    fileForm.value.reset();
    csvData.value=[]
    headers.value = {}
    Object.assign(state.value, init)
}

// on close reset upload file while close dialog window
const closeDialog = () => {
    openCSV.value=false
    reset()
}

const newTitle = computed(() =>  {
    return `給与計算関連データのCSVアップロード(最大:${init.maxRows}行まででアップください。)`
})

</script>

<template>
    <div style="display: flex;  align-items: center; margin-left: 12px;margin-top: 4px;">
        <el-button type="success" 
            @click="openCSV=true" :icon="Upload" 
                :disabled="disabled"
                title="変動CSVデータを取り込みします。">{{ title }}</el-button>
        <el-dialog v-model="openCSV" 
            :title="newTitle"
            top="3vh"
            width="70%" :fullscreen="fullScreen" draggable 
            >
            <div class="card-header">
                <form ref="fileForm">
                    <el-select v-show="false" v-model="additionals.data_type" title="アップロードデータ種類" style="width: 12em; margin-right: 8px;" placeholder="アップロードデータ種類">
                        <el-option v-for="(el, index) in data_type_list" :key="index" :value="el.value" :label="el.label"></el-option>
                    </el-select>

                    <input ref="fileInputRef" 
                        type="file" 
                        :value="selectedFile" 
                        @change="handleFileUpload" 
                        accept=".csv" 
                        style="margin-top:4px;" />

                    <el-select v-model="state.selectedEncoding" title="アップロードするファイルのエンコーディングを選択下さい！" style="width: 8em; margin-right: 8px;" placeholder="エンコーディング">
                        <el-option value="UTF-8">UTF-8</el-option>
                        <el-option value="Shift_JIS">Shift-JIS</el-option>
                    </el-select>
                    
                    <el-checkbox v-model="state.show_comment" label="説明追加"/>
                    <el-tooltip
                        class="box-item"
                        effect="dark"
                        content="取り込みCSVデータに今月のデータを給与計算に適用するかどうか指定します。"
                    >
                        <el-checkbox v-model="currentMonthToPayroll" label="当月データを給与計算に反映します"/>
                    </el-tooltip>
                </form>
                <span v-if="csvData.length>0" style="font-size: 0.9em; color:rgb(165, 42, 77)">行数：{{ csvData.length - 1 }} + 1</span>
                <el-button v-if="fullScreen" @click="toggleFullScreen" type="primary" circle :icon="Aim" title="ポップアップ画面を縮小して表示"></el-button>
                <el-button v-else @click="toggleFullScreen" type="warning" circle :icon="FullScreen" title="ポップアップ画面を全画面に表示"></el-button>
                <el-button @click="reset" type="danger" circle :icon="RefreshLeft" title="データをリセットする"></el-button>
                <el-button @click="save" :icon="UploadFilled" type="danger">保存</el-button>
                <el-button @click="closeDialog" :icon="CloseBold" type="warning" style="margin-right: 28px;">閉じる</el-button>
            </div>
            <div>
                <el-row>
                    <el-col :span="12">
                        <el-form :model="form" label-width="80px">
                            <el-form-item label="コメント:" v-show="state.show_comment">
                                <el-input v-model="additionals.csv_comment"></el-input>
                            </el-form-item>
                        </el-form>
                    </el-col>
                    <el-col :span="12">
                        <span v-if="currentFile">CSVファイル名: <b>{{ currentFile.name }}</b></span>
                    </el-col>
                </el-row>
            </div>
            <div v-if="csvData" class="table-responsive" style="height:calc(100vh - 400px); overflow:scroll; width: 100%; overflow-x: auto;">
                <AgGridDataBrowser
                    height="96%"
                    v-if="csvData"
                    ref="agGridHandler"
                    :rowData="csvData">
                </AgGridDataBrowser>
            </div>
        </el-dialog>
    </div>
</template>
