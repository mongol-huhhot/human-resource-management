<!-- RepeatableFormWrapper.vue -->
<template>
  <div>
    <div class="d-flex justify-end mb-3">
      <v-btn
        color="success"
        variant="outlined"
        :loading="saving"
        :disabled="!modelValue?.length || !props.sqltags?.save"
        @click="saveAll"
      >
        一括保存
      </v-btn>
    </div>

    <v-card
      v-for="(item, index) in modelValue"
      :key="item.__uuid || item.staff_bank_account_id || item.id || index"
      class="mb-4"
      variant="outlined"
    >
      <v-card-title>
        {{ label }} {{ index + 1 }}

        <v-spacer />

        <v-btn
          icon="mdi-delete"
          variant="text"
          color="error"
          :loading="deletingIndex === index"
          @click="remove(index, item)"
        />
      </v-card-title>

      <v-card-text>
        <DynamicVuetifyForm
          v-model="modelValue[index]"
          :fields="children"
          :show-submit="false"
          :sqltags="props.sqltags"
          :tab-config="props.tabConfig"
          :common-params="props.commonParams"
        />
      </v-card-text>
    </v-card>

    <v-btn
      color="primary"
      variant="outlined"
      @click="add"
    >
      {{ addButtonText || '追加' }}
    </v-btn>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DynamicVuetifyForm from './DynamicVuetifyForm.vue'
import { useDataStore } from '@/stores/DataStore'
import { buildLoopParams } from '@/composables/formParamBuilder'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  label: String,
  children: {
    type: Array,
    default: () => []
  },
  addButtonText: String,
  sqltags: {
    type: Object,
    default: null,
  },
  tabConfig: {
    type: Object,
    default: () => ({}),
  },
  commonParams: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue', 'saved', 'deleted'])

const dataStore = useDataStore()
const saving = ref(false)
const deletingIndex = ref(null)

function add() {
  emit('update:modelValue', [
    ...props.modelValue,
    {
      __uuid: crypto.randomUUID(),
      enabled: 'active',
    }
  ])
}

async function saveAll() {
  if (!props.sqltags?.save) return

  saving.value = true

  try {
    const params = buildLoopParams(
      props.modelValue,
      props.tabConfig,
      props.commonParams,
    )

    const result = await dataStore.saveData(
      props.sqltags.save,
      params,
    )

    emit('saved', result)
  } catch (error) {
    console.error('RepeatableFormWrapper saveAll error:', error)
  } finally {
    saving.value = false
  }
}

async function remove(index, item) {
  if (!confirm('このデータを削除しますか？')) return

  const isNew = item?.__uuid && !item?.id && !item?.staff_bank_account_id

  if (!isNew && props.sqltags?.delete) {
    deletingIndex.value = index

    try {
      const result = await dataStore.saveData(
        props.sqltags.delete,
        {
          ...props.commonParams,
          ...item,
          enabled: 'inactive',
        },
      )

      emit('deleted', result)
    } catch (error) {
      console.error('RepeatableFormWrapper delete error:', error)
      deletingIndex.value = null
      return
    }

    deletingIndex.value = null
  }

  const copied = [...props.modelValue]
  copied.splice(index, 1)
  emit('update:modelValue', copied)
}
</script>