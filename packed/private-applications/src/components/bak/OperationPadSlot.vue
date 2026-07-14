<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import interact from 'interactjs'
import { ElButton, ElCard, ElIcon } from 'element-plus'
import { Close, Minus, Rank } from '@element-plus/icons-vue'

const props = defineProps({
  title: { type: String, default: 'Operation Panel' },
  initialWidth: { type: Number, default: 420 },
  initialHeight: { type: Number, default: 260 },
  initialTop: { type: Number, default: 80 },
  initialLeft: { type: Number, default: 80 },
  minWidth: { type: Number, default: 260 },
  minHeight: { type: Number, default: 120 },
  zIndex: { type: Number, default: 3000 },
  modelValue: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'close'])

const panelRef = ref(null)
const visible = ref(props.modelValue)
const minimized = ref(false)

const width = ref(props.initialWidth)
const height = ref(props.initialHeight)
const x = ref(props.initialLeft)
const y = ref(props.initialTop)

let interactable = null

const syncStyle = () => {
  const el = panelRef.value
  if (!el) return

  el.style.width = `${width.value}px`
  el.style.height = minimized.value ? 'auto' : `${height.value}px`
  el.style.transform = `translate(${x.value}px, ${y.value}px)`
  el.style.zIndex = String(props.zIndex)
}

const closePad = () => {
  visible.value = false
  emit('update:modelValue', false)
  emit('close')
}

const toggleMinimize = () => {
  minimized.value = !minimized.value
  nextTick(syncStyle)
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
            <el-icon class="mr6"><Rank /></el-icon>
            <span>{{ title }}</span>
          </div>

          <div class="operation-pad__actions">
            <el-button text @click="toggleMinimize">
              <el-icon><Minus /></el-icon>
            </el-button>
            <el-button text @click="closePad">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <div v-show="!minimized" class="operation-pad__body">
        <slot />
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
  padding: 8px 10px;
  background: var(--el-fill-color-light);
}

.operation-pad__title {
  display: flex;
  align-items: center;
  font-weight: 600;
  gap: 6px;
}

.operation-pad__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.operation-pad__body {
  height: calc(100% - 1px);
  overflow: auto;
  padding: 12px;
  background: var(--el-bg-color);
}

.mr6 {
  margin-right: 6px;
}
</style>
