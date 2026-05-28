<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import interact from 'interactjs'
import {
  ElButton,
  ElCard,
  ElIcon,
  ElSwitch,
  ElTooltip,
} from 'element-plus'

import {
//   Close,
  Minus,
  Rank,
  Check,
  Refresh,
  Upload,
  Connection,
  Operation,
  FolderOpened,
} from '@element-plus/icons-vue'

// import CSVUpload from '@/components/csvupload/CSVUpload.vue'

const props = defineProps({
  title: { type: String, default: 'Operation Panel' },
  initialWidth: { type: Number, default: 640 },
  initialHeight: { type: Number, default: 460 },
  initialTop: { type: Number, default: 80 },
  initialLeft: { type: Number, default: 80 },
  minWidth: { type: Number, default: 420 },
  minHeight: { type: Number, default: 220 },

  // Padを必要以上に高z-indexにしない
  zIndex: { type: Number, default: 2000 },

  modelValue: { type: Boolean, default: true },

  currentMonth: { type: String, default: '' },
  deletable: { type: Boolean, default: false },
  showDeleted: { type: Boolean, default: false },
  editMode: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  cancelInfo: { type: String, default: '' },
  openCSV: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'update:currentMonth',
  'update:showDeleted',
  'update:openCSV',
  'close',
  'master-interoperability',
  'calculate-payroll',
  'confirm-close',
  'confirm-delete',
  'check-all-payroll-closed',
])

const panelRef = ref(null)
const visible = ref(props.modelValue)
const minimized = ref(false)

const width = ref(props.initialWidth)
const height = ref(props.initialHeight)
const x = ref(props.initialLeft)
const y = ref(props.initialTop)

let interactable = null

const showDeletedModel = computed({
  get: () => props.showDeleted,
  set: (val) => emit('update:showDeleted', val),
})

const openCSVModel = computed({
  get: () => props.openCSV,
  set: (val) => emit('update:openCSV', val),
})

const getDeleteRestoreLabel = computed(() => {
  return props.showDeleted
    ? '選択給与データを復元'
    : '選択給与データを削除'
})

const syncStyle = () => {
  const el = panelRef.value
  if (!el) return

  el.style.width = `${width.value}px`
  el.style.height = minimized.value ? 'auto' : `${height.value}px`
  el.style.transform = `translate(${x.value}px, ${y.value}px)`
  el.style.zIndex = String(props.zIndex)
}

// const closePad = () => {
//   visible.value = false
//   emit('update:modelValue', false)
//   emit('close')
// }

const toggleMinimize = () => {
  minimized.value = !minimized.value
  nextTick(syncStyle)
}

const handleMasterInteroperability = (mode) => {
  emit('master-interoperability', mode)
}

const handleCalculatePayroll = (mode) => {
  emit('calculate-payroll', mode)
}

const handleConfirmClose = (flag) => {
  emit('confirm-close', flag)
}

const handleConfirmDelete = () => {
  emit('confirm-delete')
}

const handleCheckAllPayrollClosed = (flag = true) => {
  emit('check-all-payroll-closed', flag)
}

onMounted(() => {
  nextTick(() => {
    syncStyle()

    if (!panelRef.value) return

    interactable = interact(panelRef.value)
      .draggable({
        allowFrom: '.operation-pad__header',
        listeners: {
          move(event) {
            x.value += event.dx
            y.value += event.dy
            syncStyle()
          }
        }
      })
      .resizable({
        edges: { top: true, left: true, bottom: true, right: true },
        listeners: {
          move(event) {
            if (minimized.value) return

            width.value = Math.max(props.minWidth, event.rect.width)
            height.value = Math.max(props.minHeight, event.rect.height)
            x.value += event.deltaRect.left
            y.value += event.deltaRect.top

            syncStyle()
          }
        },
        modifiers: [
          interact.modifiers.restrictSize({
            min: { width: props.minWidth, height: props.minHeight }
          })
        ]
      })
  })
})

onBeforeUnmount(() => {
  if (interactable) {
    interactable.unset()
    interactable = null
  }
})
</script>

<template>
  <div v-show="visible" ref="panelRef" class="operation-pad">
    <el-card shadow="always" body-style="padding: 0;">
      <template #header>
        <div class="operation-pad__header">
          <div class="operation-pad__title">
            <el-icon><Rank /></el-icon>
            <span>{{ title }}</span>
          </div>

          <div class="operation-pad__actions">
            <el-button text @click="toggleMinimize">
              <el-icon><Minus /></el-icon>
            </el-button>
            <!-- <el-button text @click="closePad">
              <el-icon><Close /></el-icon>
            </el-button> -->
          </div>
        </div>
      </template>

      <div v-show="!minimized" class="operation-pad__body">
        <div class="pad-toolbar">
          <div class="pad-toolbar__row pad-toolbar__row--top">
            <small style="margin-left: 12px; color: brown;"> 
              注：データ連携・訂正、CSV取込後は必ず給与計算を行ってください。5~10分かかります。
            </small>
            <!-- まず表示確認したいなら v-if を外す -->
            <el-tooltip
                class="box-item"
                effect="dark"
                content="有効なデータか削除したデータの表示間切り替え"
                v-if="deletable"
            >
                <el-switch
                    v-model="showDeletedModel"
                    size="large"
                    inactive-text="有効データ"
                    active-text="削除データ"                    
                    style="--el-switch-on-color: #ff4949; --el-switch-off-color: #13ce66"
                />
            </el-tooltip>
          </div>

          <div v-show="editMode" class="pad-button-grid">
            <el-tooltip
                class="box-item"
                effect="dark"
                content="選択したスタッフの個人情報・雇用契約・勤怠実績を給与計算システムに連携"
            >
                <el-button
                    :icon="Connection"
                    :disabled="isApproved"
                    type="warning"
                    @click="handleMasterInteroperability('selected')"
                >
                    選択者データ連携
                </el-button>
            </el-tooltip>
            <el-tooltip
                class="box-item"
                effect="dark"
                content="全スタッフの個人情報・雇用契約・勤怠実績を給与計算システムに連携"
            >
                <el-button
                    :icon="Connection"
                    type="warning"
                    :disabled="isApproved"
                    @click="handleMasterInteroperability('all')"
                >
                    全員データ連携
                </el-button>
            </el-tooltip>
            <el-tooltip
                class="box-item"
                effect="dark"
                content="変動データのCSV取込みします"
            >
                <el-button
                    :icon="Upload"
                    type="info"
                    :disabled="isApproved"
                    @click="openCSVModel = true"
                >
                変動データCSV取込
                </el-button>
            </el-tooltip>

            <el-tooltip
                class="box-item"
                effect="dark"
                content="選択したスタッフの給与計算を行います"
            >
                <el-button
                    :icon="Operation"
                    :disabled="isApproved"
                    @click="handleCalculatePayroll('selected')"
                >
                選択者給与計算
                </el-button>
            </el-tooltip>

            <el-tooltip
                class="box-item"
                effect="dark"
                content="全スタッフの給与計算を行います"
            >
                <el-button
                    :icon="Operation"
                    :disabled="isApproved"
                    @click="handleCalculatePayroll('all')"
                >
                全員給与計算
                </el-button>
            </el-tooltip>

            <el-tooltip
              effect="dark"
              content="給与計算を締め終えたら、その給与情報は編集できません。"
              v-if="!isApproved && !showDeleted"              
            >
              <el-button
                type="success"
                :icon="Check"
                @click="handleConfirmClose(true)"
              >
                月次締め
              </el-button>
            </el-tooltip>

            <el-tooltip
              effect="dark"
              :content="cancelInfo"
              v-if="!isApproved && !showDeleted"              
            >
              <el-button
                type="danger"
                :icon="Refresh"
                @click="handleConfirmClose(false)"
              >
                締め解除
              </el-button>
            </el-tooltip>

            <el-tooltip
              effect="dark"
              content="管理者のみ、全てのスタッフの締め処理後に給与計算の承認を行えます。"
              v-if="!isApproved && !showDeleted"              
            >
              <el-button
                type="primary"
                :icon="Check"
                @click="handleCheckAllPayrollClosed(true)"
              >
                給与確定承認
              </el-button>
            </el-tooltip>

            <el-tooltip
              effect="dark"
              content="確定承認を解除します"
              v-if="isApproved && !showDeleted"              
            >
                <el-button
                    type="warning"
                    :icon="Refresh"
                    @click="handleCheckAllPayrollClosed(false)"
                >
                確定承認解除
                </el-button>
            </el-tooltip>

            <el-tooltip
                effect="dark"
                content="選択したスタッフの給与データを削除します"
                v-if="deletable"                
            >
                <el-button
                    type="danger"
                    :icon="FolderOpened"
                    @click="handleConfirmDelete"
                >
                {{ getDeleteRestoreLabel }}
                </el-button>
            </el-tooltip>                 
          </div>
        </div>

        <!-- <CSVUpload v-model:openCSV="openCSVModel" /> -->

        <div class="pad-content">
          <slot />
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.operation-pad {
  position: fixed;
  top: 0;
  left: 0;
  box-sizing: border-box;
  user-select: none;
}

.operation-pad :deep(.el-card) {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.operation-pad__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  /* padding: 8px 10px; */
  background: var(--el-fill-color-light);
}

.operation-pad__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.operation-pad__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.operation-pad__body {
  height: 100%;
  overflow: auto;
  padding: 12px;
  background: var(--el-bg-color);
}

.pad-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.pad-toolbar__row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.pad-toolbar__row--top {
  justify-content: flex-start;
}

.month-picker {
  width: 10em;
}

.pad-button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.pad-button-grid :deep(.el-button) {
  margin-left: 0 !important;
  width: 100%;
}

.pad-content {
  margin-top: 8px;
}
</style>

<style>
/* teleportされたDatePickerのpopperをPadより前面に出す */
.salary-pad-popper {
  z-index: 5000 !important;
}
</style>
