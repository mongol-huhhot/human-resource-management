<script setup>
import UploadImageWrapper from '@/components/forms/fields/UploadImageWrapper.vue';
import { useAppConfigStore } from '@/stores/AppConfigStore';
import { useDataStore } from '@/stores/DataStore';

const dataStore = useDataStore()
// dataStore.states.currentRow.staff_id
//const myIdentityFront  = computed(()=> `${dataStore.states.currentRow.staff_id}_front` )
//const myIdentityBack  = computed(()=> `${dataStore.states.currentRow.staff_id}_back` )
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
        :category_code="mynumber_card"
        

    />
</template>
