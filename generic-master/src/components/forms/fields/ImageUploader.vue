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
})

const staffCode = computed(() => props.staffCode)
const categoryCode = computed(() => props.categoryCode)
const documentType = computed(() => props.documentType)
const ownerType = computed(() => props.ownerType)

// metaオブジェクト生成
const meta = computed(() => ({
  categoryCode: categoryCode.value,
  documentType: documentType.value,
  ownerType: ownerType.value,
  ownerId: staffCode.value
}))

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

    <UploadImageWrapper
       
       :meta="meta"
    />
</template>
