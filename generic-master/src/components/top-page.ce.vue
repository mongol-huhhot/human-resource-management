<!-- top-page.ce.vue -->
<script setup>
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

import { watch } from 'vue'
import MainLayout from '@/components/MainLayout.vue'
import { useDataStore } from '@/stores/DataStore'


const props = defineProps({
  j: {
    type: String,
    required: false,
    default: JSON.stringify({
      user_id: import.meta.env.VITE_DEV_USER_ID || 'dev_user',
      tid: import.meta.env.VITE_DEV_TENANT_ID || 'showcase',
    }),
  },
})

const dataStore = useDataStore()

watch(
  () => props.j,
  async () => {
    if (!props.j) return

    let p = props.j

    try {
      if (props.j && typeof props.j === 'string') {
        p = JSON.parse(props.j.replace(/&quot;/g, '"'))
      }
    } catch (e) {
      console.log(e)
      return
    }

    dataStore.params.attributes = p

    const result = await login();

    await dataStore.get_user_register({
       user_id: p.user_id,
    })
  },
  {
    deep: true,
    immediate: true,
  }
)

// select * from user_schema.check_user(<%user%>, <%password%>)
async function login() {
  const result = await dataStore.login({
    user: 'its@janga.co.jp',
    password: 'janga1',
  },{remember: true})

  console.log('Login result:', result)
  return result
}

</script>

<template>
  <v-locale-provider locale="ja">
    <div v-if="props.j">
      <MainLayout />
    </div>

    <div v-else>
      <h4 style="color: brown;">
        必要なパラメータが設定されてない！
      </h4>
    </div>
  </v-locale-provider>
</template>
