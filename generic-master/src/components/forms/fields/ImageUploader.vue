<script setup>
import UploadImageWrapper from '@/components/forms/fields/UploadImageWrapper.vue';
import { useAppConfigStore } from '@/stores/AppConfigStore';
import { useDataStore } from '@/stores/DataStore';

const dataStore = useDataStore()
// dataStore.states.currentRow.staff_id
//const myIdentityFront  = computed(()=> `${dataStore.states.currentRow.staff_id}_front` )
//const myIdentityBack  = computed(()=> `${dataStore.states.currentRow.staff_id}_back` )

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [] // ★ デフォルトを空配列にしておく
  },
  category_code: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: ''
  }
})

</script>

<template>
    <!-- <UploadImageWrapper
        category_code="student_card"
        :identidy="myIdentityFront"
    />
    <UploadImageWrapper
        category_code="student_card"
        :identidy="myIdentityBack"
    /> -->

    <UploadImageWrapper
        :initialFiles="modelValue"

    />
</template>
