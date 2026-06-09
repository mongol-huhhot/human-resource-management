<!-- AppProcessSelector.vue -->
<script setup>
import { computed, ref, watch } from 'vue'
import { useDataStore } from '@/stores/DataStore'

const model = defineModel({
  type: Object,
  default: () => ({
    app_code: null,
    process_code: null,
  }),
})

const props = defineProps({
  label: {
    type: String,
    default: 'アプリ・機能',
  },
  disabled: Boolean,
  readonly: Boolean,
})

const dataStore = useDataStore()

const cat = ref([])
const loading = ref(false)

const apps = computed(() => {
  return dataStore.formMasters?.apps || []
})

function updateApp(appCode) {
  model.value = {
    ...(model.value || {}),
    app_code: appCode,
    process_code: null,
  }
}

function updateProcess(processCode) {
  model.value = {
    ...(model.value || {}),
    process_code: processCode,
  }
}

async function loadCategory(catcode) {
  if (!catcode) {
    cat.value = []
    return
  }

  loading.value = true

  try {
    const condition = {
      SQLTAG: 'masters.get_app_item_category',
      category_code: catcode,
      enabled: 'active',
    }

    const result = await dataStore.runLoad(
      'masters.get_app_item_category',
      condition,
      'app_cat'
    )

    console.log("result===", result)

    // const rows =
    //   result?.app_cat?.result ||
    //   result?.result ||
    //   result?.data?.app_cat ||
    //   result?.data ||
    //   []

    cat.value = Array.isArray(result) ? result : []
  } catch (e) {
    console.error('AppProcessSelector loadCategory error:', e)
    cat.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => model.value?.app_code,
  async nv => {
    if (!nv) {
      cat.value = []
      updateProcess(null)
      return
    }

    await loadCategory(nv)
  },
  { immediate: true }
)
</script>

<template>
  <div class="app-process-selector">
    <v-row dense>
      <v-col cols="12" md="6">
        <v-select
          :model-value="model?.app_code"
          label="アプリ"
          :items="apps"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="comfortable"
          clearable
          :disabled="disabled || readonly"
          @update:model-value="updateApp"
        />
      </v-col>

      <v-col cols="12" md="6">
        <v-select
          :model-value="model?.process_code"
          label="機能"
          :items="cat"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="comfortable"
          clearable
          :loading="loading"
          :disabled="disabled || readonly || !model?.app_code"
          @update:model-value="updateProcess"
        />
      </v-col>
    </v-row>
  </div>
</template>