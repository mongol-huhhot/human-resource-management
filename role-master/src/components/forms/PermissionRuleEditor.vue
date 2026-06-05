<template>
  <v-card variant="outlined" class="pa-4 mb-4">
    <div class="text-h6 mb-3">{{ title }}</div>

    <v-radio-group v-model="mode">
      <v-radio label="全項目許可" value="all" />

      <v-radio
        label="指定項目だけ許可 includes"
        value="includes"
      />

      <v-radio
        label="指定項目を除外 excludes"
        value="excludes"
      />

      <v-radio
        v-if="allowNoAccess"
        label="すべて禁止"
        value="none"
      />
    </v-radio-group>

    <v-select
      v-if="mode === 'includes' || mode === 'excludes'"
      v-model="selectedFields"
      :label="mode === 'includes' ? '許可する項目' : '除外する項目'"
      :items="fields"
      item-title="label"
      item-value="value"
      multiple
      chips
      closable-chips
      variant="outlined"
      density="comfortable"
    />

    <v-textarea
      :model-value="previewJson"
      label="保存されるJSON"
      readonly
      rows="3"
      variant="outlined"
      class="mt-3"
    />
  </v-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  modelValue: {
    type: [Object, null],
    default: null,
  },
  fields: {
    type: Array,
    default: () => [],
  },
  allowNoAccess: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const mode = ref('all')
const selectedFields = ref([])

watch(
  () => props.modelValue,
  value => {
    if (!value) {
      mode.value = 'all'
      selectedFields.value = []
      return
    }

    if (value.includes) {
      mode.value = 'includes'
      selectedFields.value = value.includes
    } else if (value.excludes) {
      mode.value = 'excludes'
      selectedFields.value = value.excludes
    } else if (value.includes && value.includes.length === 0) {
      mode.value = 'none'
      selectedFields.value = []
    }
  },
  { immediate: true }
)

watch([mode, selectedFields], () => {
  if (mode.value === 'all') {
    emit('update:modelValue', null)
  } else if (mode.value === 'includes') {
    emit('update:modelValue', {
      includes: selectedFields.value,
    })
  } else if (mode.value === 'excludes') {
    emit('update:modelValue', {
      excludes: selectedFields.value,
    })
  } else if (mode.value === 'none') {
    emit('update:modelValue', {
      includes: [],
    })
  }
}, { deep: true })

const previewJson = computed(() => {
  if (mode.value === 'all') {
    return 'null'
  }

  if (mode.value === 'includes') {
    return JSON.stringify({ includes: selectedFields.value }, null, 2)
  }

  if (mode.value === 'excludes') {
    return JSON.stringify({ excludes: selectedFields.value }, null, 2)
  }

  if (mode.value === 'none') {
    return JSON.stringify({ includes: [] }, null, 2)
  }

  return 'null'
})
</script>