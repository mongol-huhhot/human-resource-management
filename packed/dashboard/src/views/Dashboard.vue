<script setup>
import { ref, computed, onMounted } from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { useAppConfigStore } from '@/stores/AppConfigStore'
import { useDataStore } from '@/stores/DataStore'
import TodoPane from '@/components/dashboard/TodoPane.vue'
import NoticePane from '@/components/dashboard/NoticePane.vue'
import MenuPane from '@/components/dashboard/MenuPane.vue'
import StaffList from '@/views/StaffList.vue'
import FormVuetifyContainer from '@/components/forms/FormVuetifyContainer.vue'

const appConfigStore = useAppConfigStore()
const dataStore = useDataStore()
appConfigStore.loadFromWindow()

const horizontal_vertical = ref('horizontal') // 'horizontal' or 'vertical'

const toggleMode = () => {
    horizontal_vertical.value = horizontal_vertical.value === 'horizontal' ? 'vertical' : 'horizontal'
}


const todos = ref(appConfigStore?.DASHBOARD_CONFIG?.todos || [])

// 未処理として数える申請ステータス。DASHBOARD_CONFIG.pending_statuses で導入先毎に変更できる
const DEFAULT_PENDING_STATUSES = ['submitted']

function pendingStatuses() {
    const configured = appConfigStore?.DASHBOARD_CONFIG?.pending_statuses
    if (Array.isArray(configured) && configured.length) return configured.join(',')
    if (typeof configured === 'string' && configured) return configured
    return DEFAULT_PENDING_STATUSES.join(',')
}
const notices = computed(() => appConfigStore?.DASHBOARD_CONFIG?.notices || [])
const menus = computed(() => appConfigStore?.DASHBOARD_CONFIG?.menus || [])

onMounted(async () => {
    await loadTodos()
})

async function loadTodos() {
    // get_staff_personal_request_counts_by_category は staff_id を渡さない場合、全スタッフ分を集計する
    const result = await dataStore.dbAccessWithMultiTags({
        request_counts: {
            SQLTAG: 'get_staff_personal_request_counts_by_category',
            category_code: 'staffs',
            request_statuses: pendingStatuses(),
            staff_id: null,
        },
    })

    if (result.code !== 0) {
        console.error('Failed to load todos:', result.message)
        return
    }

    const rows = result.data?.request_counts || []
    if (!rows.length) return

    todos.value = rows.map(cat => ({
        type: cat.remarks || cat.sub_category_name || cat.sub_category_code,
        text: cat.category_name,
        color: 'red',
        category_code: cat.category_code,
        sub_category_code: cat.sub_category_code,
        data_structure: cat.data_structure,
        ui_component: cat.ui_component,
        count: Number(cat.count) || 0,
    }))
}

// 処理待ち画面ダイアログの状態
const todoDialog = ref(false)
const currentTodo = ref(null)
const selectedRow = ref(null)

// 処理待ちから開くスタッフ一覧の絞り込み条件。currentTodo に連動する
const staffListFilter = computed(() => {
    if (!currentTodo.value?.sub_category_code) return null
    return {
        sub_category_code: currentTodo.value.sub_category_code,
        request_statuses: pendingStatuses(),
    }
})

// 処理待ちの「確認」ボタン。スタッフ一覧をダイアログで開く
function handleTodoConfirm(item) {
    currentTodo.value = item
    selectedRow.value = null
    todoDialog.value = true
}

// スタッフ一覧で行選択。選択スタッフをフォームコンテナに渡す
function handleStaffSelected(row) {
    selectedRow.value = row
    dataStore.params.attributes = row || {}
}

// ダイアログを閉じるときも件数を最新化する
async function closeTodoDialog() {
    todoDialog.value = false
    await loadTodos()
}

// メニュー選択。今後 menu.url への遷移をここに実装する
function handleMenuSelect(menu) {
    console.log('menu select:', menu)
}
</script>

<template>
  <v-app>
    <v-layout>
      <!-- <v-app-bar color="light-blue" height="56" flat>
        <v-toolbar-title class="text-white text-subtitle-1">
          ホーム ｜ 導入設定 ｜ マスタ管理 ｜ 人事本部 ｜ 給与関連 ｜ 人事評価 ｜ 個人ポータル ｜ 経理本部 ｜ 総務本部 ｜ 営業本部
        </v-toolbar-title>
      </v-app-bar> -->

      <v-main>
        <div class="dashboard">
          <splitpanes class="default-theme main-split" :horizontal="horizontal_vertical !== 'horizontal'">
            <!-- 左 pane 処理待ち -->
            <pane size="36" min-size="20">
              <TodoPane
                :todos="todos"
                :horizontal="horizontal_vertical === 'horizontal'"
                @confirm="handleTodoConfirm"
                @toggle-mode="toggleMode"
              />
            </pane>

            <!-- 中央 pane 通知・お知らせ -->
            <pane size="30" min-size="20">
              <NoticePane :notices="notices" />
            </pane>

            <!-- 右 pane 全部（メニュー） -->
            <pane size="34" min-size="22">
              <MenuPane :menus="menus" @select="handleMenuSelect" />
            </pane>
          </splitpanes>
        </div>

        <!-- 処理待ち「確認」で開く画面 -->
        <v-dialog
          v-model="todoDialog"
          fullscreen
          >
          <v-card class="todo-dialog-card">
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-subtitle-1 font-weight-bold">
                <span v-if="currentTodo?.type">[{{ currentTodo.type }}]</span>
                {{ currentTodo?.text }}
              </span>

              <v-btn
                icon="mdi-close"
                variant="text"
                @click="closeTodoDialog"
              />
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-2 todo-dialog-body">
              <splitpanes class="default-theme" style="height: 100%;">
                <!-- 左 pane スタッフ一覧 -->
                <pane size="45" min-size="20">
                  <div class="dialog-list-pane">
                    <StaffList
                      :request-filter="staffListFilter"
                      @row-selected="handleStaffSelected"
                    />
                  </div>
                </pane>

                <!-- 右 pane フォーム -->
                <pane size="55" min-size="30">
                  <div v-if="selectedRow" class="dialog-form-pane">
                    <FormVuetifyContainer
                      :key="`${currentTodo?.sub_category_code}:${selectedRow?.staff_id || selectedRow?.staff_code}`"
                      :ApplicationType="currentTodo?.sub_category_code"
                    />
                  </div>
                  <div v-else class="dialog-form-placeholder">
                    左の一覧からスタッフを選択してください
                  </div>
                </pane>
              </splitpanes>
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-main>
    </v-layout>
  </v-app>
</template>

<style scoped>
.dashboard {
  height: calc(100vh - 100px);
  background: #f5f7fa;
  padding: 8px;
}

.main-split {
  height: 100%;
}

/* splitpanes の境界線 */
:deep(.splitpanes__splitter) {
  background: #e0e0e0;
  width: 5px;
}

:deep(.splitpanes__splitter:hover) {
  background: #29b6f6;
}

.todo-dialog-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.todo-dialog-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.dialog-list-pane {
  height: 100%;
  overflow-y: auto;
}

.dialog-form-pane {
  height: 100%;
  overflow-y: auto;
}

.dialog-form-pane :deep(.container-card) {
  height: auto;
  min-height: 100%;
}

.dialog-form-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #90a4ae;
  font-size: 1.1em;
}
</style>
