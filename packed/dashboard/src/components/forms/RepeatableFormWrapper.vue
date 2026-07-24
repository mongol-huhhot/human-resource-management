<!-- RepeatableFormWrapper.vue -->
<template>
  <div>
    <!-- <div class="d-flex justify-end mb-3">
      <v-btn
        color="primary"
        class="me-2"
        :loading="saving"
        :disabled="!modelValue?.length || !props.sqlTags?.save || controls?.draftSave?.disabled"
        v-show="controls?.draftSave?.show"
        @click="submit('draft')"
      >
        下書き保存
      </v-btn>
      <v-btn
        color="primary"
        :loading="saving"
        :disabled="!modelValue?.length || !props.sqlTags?.save || controls?.submit?.disabled"
        v-show="controls?.submit?.show"
        @click="submit('submitted')"
      >
        登録・変更申請
      </v-btn>
    </div> -->

    <v-card
      v-for="(item, index) in modelValue"
      :key="item.__uuid || item.staff_bank_account_id || item.id || index"
      class="mb-4"
      variant="outlined"
    >
      <v-card-title>
        {{ label }} {{ index + 1 }}

        <v-spacer />

        <!-- <v-btn
          icon="mdi-delete"
          variant="text"
          color="error"
          :loading="deletingIndex === index"
          @click="remove(index, item)"
        /> -->
      </v-card-title>

      <v-card-text>
        <DynamicVuetifyForm
          v-model="modelValue[index]"
          :ref="el => formRefs[index] = el"
          :fields="children"
          :is-repeatable="true"
          :show-submit="true"
          :controls="controls"
          :chipControls="chipControls"
          @submit="data => emit('submit', data)"
          :sqlTags="props.sqlTags"
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
import { ref,computed } from 'vue'
import DynamicVuetifyForm from './DynamicVuetifyForm.vue'
import { useDataStore } from '@/stores/DataStore'
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
  sqlTags: {
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
  controls: {
    type: Object, 
    default: null 
  },
  chipControls: {
    type: Object, 
    default: null 
  },
})

const emit = defineEmits(['update:modelValue', 'saved', 'deleted'])

const dataStore = useDataStore()
const saving = ref(false)
const deletingIndex = ref(null)
const formRefs = ref([])
const controls = computed(() =>props.controls)
const chipControls = computed(() =>props.chipControls)

console.log("repeatable.props",props)

function add() {
  emit('update:modelValue', [
    ...props.modelValue,
    {
      __uuid: crypto.randomUUID(),
      enabled: 'active',
    }
  ])
}

// 送信処理
async function submit(request_status) {

  for (const form of formRefs.value) {
    //console.log("repetable validate start",form)
    const result = await form.validate()
      if (!result) {
        console.log("repetable validate is false")
          return 
      }
      console.log("repetable validate is true")
  }
  
    emit('submit',request_status)
}

// async function saveAll() {
//   if (!props.sqlTags?.save) return

//   saving.value = true

//   try {
//     const params = buildLoopParams(
//       props.modelValue,
//       props.tabConfig,
//       props.commonParams,
//     )

//     const result = await dataStore.saveData(
//       props.sqlTags.save,
//       params,
//     )

//     emit('saved', result)
//   } catch (error) {
//     console.error('RepeatableFormWrapper saveAll error:', error)
//   } finally {
//     saving.value = false
//   }
// }

async function remove(index, item) {
  if (!confirm('このデータを削除しますか？')) return

  const isNew = item?.__uuid && !item?.id && !item?.staff_bank_account_id

  if (!isNew && props.sqlTags?.delete) {
    deletingIndex.value = index

    try {
      const result = await dataStore.saveData(
        props.sqlTags.delete,
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

// watch(
//   formRefs,
//   (newformRefs) => {
//     console.log("formdata watch",newformRefs)
//     console.log("formdata watch",newformRefs[0])
//     console.log("formdata watch",newformRefs[0].validate)
//   },
//   {
//     deep: true
//   }
// )
</script>
