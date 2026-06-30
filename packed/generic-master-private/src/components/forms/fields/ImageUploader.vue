<script setup>
import { computed } from 'vue'
import UploadImageWrapper from '@/components/forms/fields/UploadImageWrapper.vue';
import { useAppConfigStore } from '@/stores/AppConfigStore';
import { useDataStore } from '@/stores/DataStore';

const dataStore = useDataStore()
// dataStore.states.currentRow.staff_id
//const myIdentityFront  = computed(()=> `${dataStore.states.currentRow.staff_id}_front` )
//const myIdentityBack  = computed(()=> `${dataStore.states.currentRow.staff_id}_back` )

const props = defineProps({
  staffCode: {
    type: String,
    default: ''
  },
  categoryCode: {
    type: String,
    default: ''
  },
  documentType: {
    type: String,
    default: ''
  },
  ownerType: {
    type: String,
    default: 'staff'
  },
  recordId: {
    type: String,
    default: ''
  },
  isRepeatable: { type: Boolean, default: false },
})

const staffCode = computed(() => props.staffCode)
const categoryCode = computed(() => props.categoryCode)
const documentType = computed(() => props.documentType)
const ownerType = computed(() => props.ownerType)
const recordId = computed(() => props.recordId)

const meta = computed(() => {
  const meta = {
    categoryCode: categoryCode.value,
    documentType: documentType.value,
    ownerType: ownerType.value,
    ownerId: staffCode.value,
  }

  if (props.isRepeatable && props.recordId) {
    meta.recordId = recordId.value
  }

  return meta
})

const canLoad = computed(() => {
  // single画像は常にロード可能
  if (!props.isRepeatable) {
    return true
  }

  // repeatableはrecord_id必須
  return !!props.recordId
})

console.log("imageuploader.props=====",meta)

</script>

<template>
    <!-- <UploadImageWrapper
       :meta="{
          categoryCode: 'profile',
          documentType: 'mynumber_card',
          ownerType: 'staff',
          ownerId: '11111'
       }"
    /> -->

    <!-- <UploadImageWrapper
       
       :meta="meta"
    /> -->

    <div
    v-if="props.isRepeatable && !canLoad"
    class="text-medium-emphasis pa-4 text-center"
  >
    この銀行口座情報を保存すると画像を登録できます
  </div>

  <UploadImageWrapper
    v-else
    :meta="meta"
  />

</template>
