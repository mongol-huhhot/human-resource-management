<script setup>
import { ref, watch } from 'vue'
import MainLayout from '@/components/MainLayout.vue'
import { useDataStore } from '@/stores/DataStore'
import S3FileManager from './files/S3FileManager.vue'
import UploadImageWrapper from './files/UploadImageWrapper.vue'

const props = defineProps({
  j: {
    type: String,
    required: false,
    default: JSON.stringify({
      user_id: import.meta.env.VITE_DEV_USER_ID || 'dev_user',
      tid: import.meta.env.VITE_DEV_TENANT_ID || 'premier',
    }),
  },
})

const dataStore = useDataStore()
const loginReady = ref(false)

//テスト用
//本来はDBから取得したもの
const files_info = [
  {
    "object_key": "staff/staff_11111/mynumber_card_front/2026/06",
    "show_order": 1,
    "is_removed": false
  },
  {
    "object_key": "staff/staff_11111/mynumber_card_back/2026/06",
    "show_order": 2,
    "is_removed": false
  }
]

const isLocalDev = () => {
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1'
}

watch(
  () => props.j,
  async () => {
    loginReady.value = false

    if (!props.j) return

    let p = props.j

    try {
      if (typeof props.j === 'string') {
        p = JSON.parse(props.j.replace(/&quot;/g, '"'))
      }
    } catch (e) {
      console.log(e)
      return
    }

    dataStore.params.attributes = p

    if (isLocalDev()) {
      const result = await devLogin()

      console.log('Dev login result:', result)
      console.log('token local:', localStorage.getItem('token'))
      console.log('token session:', sessionStorage.getItem('token'))

      loginReady.value =
        result?.code === 0 &&
        !!(localStorage.getItem('token') || sessionStorage.getItem('token'))

      return
    }

    // 通常環境：全体ログインに頼る
    const verified = await dataStore.verify({
      loading: false,
    })

    loginReady.value = !!verified
  },
  {
    deep: true,
    immediate: true,
  }
)

async function devLogin() {
  return await dataStore.login(
    {
      user: import.meta.env.VITE_DEV_LOGIN_USER || 'its@janga.co.jp',
      password: import.meta.env.VITE_DEV_LOGIN_PASSWORD || 'janga1',
    },
    {
      persist: true,
      loading: true,
    }
  )
}
</script>

<template>
  <v-locale-provider locale="ja">
    <!-- <UploadImageWrapper 
          :category_code="my_number",
          :owner_id="staff_11111"
    /> -->

    <UploadImageWrapper 
       :owner_id="staff_11111"
       :files_info="files_info"
    />
    
    <!-- <S3FileManager /> -->
  </v-locale-provider>
</template>