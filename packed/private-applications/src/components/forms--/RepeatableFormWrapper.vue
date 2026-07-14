<script setup>
import { ref } from 'vue'
import DynamicVuetifyForm from './DynamicVuetifyForm.vue'
import { useDataStore } from '@/stores/DataStore'
import { buildLoopParams } from '@/composables/formParamBuilder'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  label: String,
  children: {
    type: Array,
    default: () => [],
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
    },
  ])
}

async function saveAll() {
  if (!props.sqltags?.save) {
    console.error('sqltags.save is not defined')
    return
  }

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

  // 新規追加でDB未保存の場合は画面から消すだけ
  if (item.__uuid && !item.id && !item.staff_bank_account_id) {
    removeFromLocal(index)
    return
  }

  if (props.sqltags?.delete) {
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
      return
    } finally {
      deletingIndex.value = null
    }
  }

  removeFromLocal(index)
}

function removeFromLocal(index) {
  const copied = [...props.modelValue]
  copied.splice(index, 1)
  emit('update:modelValue', copied)
}
</script>

<template>
  <div>
    <div class="d-flex justify-end mb-3">
      <v-btn
        color="success"
        :loading="saving"
        :disabled="!modelValue?.length || !props.sqltags?.save"
        @click="saveAll"
      >
        一括保存
      </v-btn>
    </div>

    <v-card
      v-for="(item, index) in modelValue"
      :key="item.__uuid || item.id || item.staff_bank_account_id || index"
      class="mb-4"
      variant="outlined"
    >
      <v-card-title class="d-flex align-center">
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
          :sqltags="props.sqltags"
          :tab-config="props.tabConfig"
          :common-params="props.commonParams"
          mode="repeatable"
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