<!-- MainLayout.vue -->
<script setup>
import MainList from '@/components/MainList.vue'
import FormVuetifyContainer from '@/components/forms/FormVuetifyContainer.vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

</script>

<template>
  <!-- <v-container 
    fluid
    class="pa-0 main-layout-container"
  > -->
  <Splitpanes
    ref="splitpanesRef"
    class="default-theme"
    style="height: 100%; width: 100%;"
  >
    <Pane min-size="10">
      <MainList />
    </Pane>

    <Pane min-size="10">
      <FormVuetifyContainer />
    </Pane>
  </Splitpanes>
  <!-- </v-container> -->
</template>

<style scoped>
.main-layout-container {
  height: calc(100vh - 180px);
  width: 100%;
}
</style>
