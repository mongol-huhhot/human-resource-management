<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  open: Boolean,
  value: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'update:open',
  'apply',
  'clear',
])

const text = ref('')

watch(
  () => props.open,
  (v) => {
    if (v) {
      text.value = props.value || ''
    }
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

function clearFilter() {
  text.value = ''
  emit('clear')
  close()
}
</script>

<template>
  <v-dialog
    :model-value="open"
    max-width="520"
    @update:model-value="close"
  >
    <v-card>
      <v-card-title class="text-h6">
        Quick Filter
      </v-card-title>

      <v-card-text>
        <v-text-field
          v-model="text"
          clearable
          variant="outlined"
          density="comfortable"
          placeholder="全カラムから検索(matches any column text)"
          @keyup.enter="apply"
        />

        <div
          style="
            margin-top: 10px;
            color: #666;
            font-size: 12px;
          "
        >
          Enterキーで適用できます。空で適用するとフィルター解除です。
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn
          variant="text"
          @click="close"
        >
          キャンセル
        </v-btn>

        <v-btn
          color="warning"
          variant="text"
          @click="clearFilter"
        >
          クリア
        </v-btn>

        <v-btn
          color="primary"
          @click="apply"
        >
          適用
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>