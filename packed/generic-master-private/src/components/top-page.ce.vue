<!-- top-page.ce.vue -->
<script setup>
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

import { watch, ref } from 'vue'
import FormVuetifyContainer from '@/components/forms/FormVuetifyContainer.vue'
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
    console.log('Received j:', props.j)
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

    //userと紐付けられたstaffを取得する処理を記述したが実際に使うわけではないのでコメントアウト
    // console.log("dataStore?.params?.attributes?.user_id",dataStore?.params?.attributes?.user_id)

    // const sc = await dataStore.get_user_staff({
    //     userid: dataStore.params.attributes.user_id
    // })

    // console.log("result get_user_staff=====",sc )

    // const staff_code = sc[0].staff_code;
    // const staff_id = sc[0].staff_id;

    // dataStore.params.attributes.staff_code = staff_code
    // dataStore.params.attributes.staff_id = staff_id
    // if(staff_id) initialized.value = true
    
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
      <FormVuetifyContainer 
      :ApplicationType="dataStore.params.attributes.app_type"
      />
    </div>

    <div v-else>
      <h4 style="color: brown;">
        必要なパラメータが設定されてない！
      </h4>
    </div>
  </v-locale-provider>
</template>
