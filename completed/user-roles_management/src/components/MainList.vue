<!-- MainList.vue
  １）config からMAIN_CONFIG.grid.sql_tagでデータ検索
  ２）conditionsは必要に応じてObject変数として追加
-->
<script setup>
import { watch, nextTick, ref, computed, } from 'vue'

// import dayjs from 'dayjs'

import { useDataStore } from '@/stores/DataStore'
import { useAppConfigStore } from '@/stores/AppConfigStore'
import CSVUpload from '@/components/helper/csvupload/CSVUpload.vue'
import AgGridDataBrowser from '@/components/helper/grid/PagedAgGridCard.vue'
// import { tr } from 'vuetify/lib/locale'

const agGridHandler = ref(null)

const dataStore = useDataStore()

const configStore = useAppConfigStore()
configStore.loadFromWindow()

const config = computed(() => configStore.MAIN_CONFIG)
const sqltag = computed(() => config.value.grid.sql_tag)
const condt = computed(() => config.value.grid.condition)
const conditions = ref(condt.value)

const selectedVisibleColumnCount = ref(0)

const rows = ref([])

const openCSV = ref(false)

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
  // 実際日付など条件が必要な場合conditions.valueに入れて検索してください
  // console.log("sqltag====",sqltag)
  let val = await dataStore.runLoad(sqltag.value, conditions.value || { }, sqltag.value)
  rows.value = val
  await nextTick()
}

watch(
  [sqltag, conditions],
  async ([snv, cnv]) => {
    console.log('snv,cnv===', snv, cnv)

    if (!snv) return

    await loadData()
  },
  {
    immediate: true,
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

async function handleDownload() {
}

</script>

<template>
  <v-card class="card_box">
   
    <v-card-title>
      <div class="d-flex align-center flex-wrap ga-3">
        <h4>
          ユーザーロール管理
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
        <div class="box_header">
          <CSVUpload
            v-model:openCSV="openCSV"
            title="CSV"
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
                CSV出力
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </div>

      <AgGridDataBrowser
        v-if="rows"
        ref="agGridHandler"
        :rowData="rows"
        :columns="gridColumns"
        height="calc(100vh - 310px)"
        @row-click="handleRowClick"
        @selected-rows-change="$emit('selected-rows-change', $event)"
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
