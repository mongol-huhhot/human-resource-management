<!-- MainLayoutWithList.vue
  左に一覧を表示し、右にフォームを表示する。管理者用機能基本
  -->
<script setup>
import { ref, computed } from 'vue'
import MainList from '@/components/MainList.vue'
import FormVuetifyContainer from '@/components/forms/FormVuetifyContainerHybrid.vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

const selectedRows = ref([])

const selectedUserIds = computed(() =>
  selectedRows.value
    .map(row => row.user_id)
    .filter(Boolean)
)
</script>

<template>
  <Splitpanes
    ref="splitpanesRef"
    class="default-theme"
    style="height: 100%; width: 100%;"
  >
    <Pane min-size="10">
      <MainList
        @selected-rows-change="selectedRows = $event"
      />
    </Pane>

    <Pane min-size="10">
      <FormVuetifyContainer
        :selected-rows="selectedRows"
        :selected-user-ids="selectedUserIds"
      />
    </Pane>
  </Splitpanes>
</template>

