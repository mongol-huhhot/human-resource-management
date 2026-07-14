<script setup>
import { ref, watch } from 'vue'
import { ElDialog, ElInput, ElButton } from 'element-plus'

const props = defineProps({
  open: Boolean,
  value: { type: String, default: '' },
})

const emit = defineEmits(['update:open', 'apply', 'clear'])

const text = ref('')

watch(
  () => props.open,
  (v) => {
    if (v) text.value = props.value || ''
  },
  { immediate: true }
)

function close() {
  emit('update:open', false)
}

function apply() {
  emit('apply', text.value || '')
  close()
}

function clear() {
  text.value = ''
  emit('clear')
  close()
}
</script>

<template>
  <el-dialog
    :model-value="open"
    title="Quick Filter"
    width="520px"
    @close="close"
  >
    <el-input
      v-model="text"
      clearable
      placeholder="全カラムから検索(matches any column text)"
      @keyup.enter="apply"
    />

    <div style="margin-top: 10px; color:#666; font-size: 12px;">
      Enterキーで適用できます。空で適用するとフィルター解除です。
    </div>

    <template #footer>
      <el-button @click="close">キャンセル</el-button>
      <el-button @click="clear">クリア</el-button>
      <el-button type="primary" @click="apply">適用</el-button>
    </template>
  </el-dialog>
</template>
