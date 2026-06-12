<template>
  <!-- Use Vuetify's grid system for true responsiveness -->
  <v-container fluid class="pa-0">
    <v-row 
      :class="configStore.UploadFiles?.[props.category_code]?.direction === 'row' ? 'flex-md-row' : 'flex-column'"
      align-items="center"
      no-gutters
    >
      <!-- Dynamically render each file upload field -->
      <v-col
        v-for="fileConfig in configStore.UploadFiles?.[props.category_code]?.files || []"
        :key="fileConfig.field"
        cols="12"
        :md="getMdColSpan(configStore.UploadFiles?.[props.category_code]?.files)"
        class="d-flex justify-center"
      >
        <UploadImage
          :label="fileConfig.headerName"
          :identity="fileConfig.field"
          :width="configStore.UploadFiles?.[props.category_code]?.width || 400"
          :height="configStore.UploadFiles?.[props.category_code]?.height || 400"
          :return-type="configStore.UploadFiles?.[props.category_code]?.returnType || 'blob'"
          :editable="configStore.UploadFiles?.[props.category_code]?.editable ?? true"
          :src="url"
          @cropped="handleCropped(fileConfig.field, $event)"
          class="w-100"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import UploadImage from './UploadImage.vue'
import { useAppConfigStore } from '@/stores/AppConfigStore'
// import { computed } from 'vue'

const configStore = useAppConfigStore()
configStore.loadFromWindow()

const props = defineProps({
  category_code: {
    type: String,
    default: 'student_card',
  },
})

// Hardcoded test URL – remove later
const url = 'https://cdn.vuetifyjs.com/images/cards/sunshine.jpg'

console.log('Direction:', configStore.UploadFiles?.direction)

function handleCropped(identity, cropped) {
  if (cropped) {
    console.log('Cropped image received:', identity, cropped)
  } else {
    console.error('Invalid cropped data')
  }
}

// Compute how many columns each item should take (e.g., 6 for 2 items, 4 for 3)
const getMdColSpan = (filesArray) => {
  const length = filesArray?.length || 1
  return Math.max(3, Math.floor(12 / length)) // Max 4 items side-by-side
}
</script>

<style scoped>
/* Ensure container doesn't restrict width */
.image-wrapper-container {
  width: 100%;
}

/* On small screens, force stacking even if direction=row */
@media (max-width: 959px) {
  .flex-md-row {
    flex-direction: column !important;
  }
}
</style>