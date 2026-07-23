<script setup>
import { ref, onBeforeMount,  } from "vue";
import Dashboard from "./Dashboard.vue";
// import Dashboard from "./AttendanceDashboard.vue";
// import Dashboard from "./AttendanceDashboard2.vue";
import { useDataStore } from "@/stores/DataStore";

const dataStore = useDataStore()

const isLocalDev = () => {
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1'
}

async function checkLogin() {
    // ログインチェック
    if ( isLocalDev() ) {
      const result = await devLogin()
      console.log('Dev login result:', result)
      loginReady.value = result?.code === 0 && !!(localStorage.getItem('token') || sessionStorage.getItem('token'))
    } else {
      const verified = await dataStore.verify({
        loading: false,
      })
      loginReady.value = !!verified
    }

    return loginReady.value
}

// ログイン完了までDashboardを描画しない
const loginReady = ref(false)

// ユーザー登録のためのログイン処理
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

onBeforeMount(async () => {
  loginReady.value = await checkLogin()
})

const props = defineProps({
  logoSrc:      String,
  logoWidth:    Number,
  logoHeight:   Number
})

const logo = {
  src   : props.logoSrc   || 'surupas-sms.png',
  width : props.logoWidth || 300,
  height: props.logoHeight|| 80
}
</script>

<template>
  <v-container fluid class="pa-0 ma-0 fill-height" style="width: 100vw;">
    <!-- <UserAuth /> -->
    <Dashboard v-if="loginReady" />
  </v-container>
</template>
