<!-- top-page.ce.vue -->
<script setup>
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

import { watch } from 'vue'

//import MainLayout from '@/components/MainLayout.vue'

import S3FileManager from '@/components/files/S3FileManager.vue'

import MainLayout from '@/components/MainLayout.vue'
import { useDataStore } from '@/stores/DataStore'

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

function isLocalDev() {
  return (
    import.meta.env.DEV &&
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
  )
}

function parseParams(value) {
  if (!value) return null

  if (typeof value === 'object') {
    return value
  }

  try {
    return JSON.parse(String(value).replace(/&quot;/g, '"'))
  } catch (e) {
    console.error('props.j JSON parse error:', e)
    return null
  }
}

async function devAutoLogin() {
  if (!isLocalDev()) return

  const token = localStorage.getItem('token')
  if (token) return

  const user = import.meta.env.VITE_DEV_LOGIN_USER || 'its@janga.co.jp'
  const password = import.meta.env.VITE_DEV_LOGIN_PASSWORD || 'janga1'

  const result = await dataStore.login(
    {
      user,
      password,
    },
    {
      remember: true,
    }
  )

  console.log('Dev auto login result:', result)
  return result
}

function isLocalDev() {
  return (
    import.meta.env.DEV &&
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
  )
}

function parseParams(value) {
  if (!value) return null

  if (typeof value === 'object') {
    return value
  }

  try {
    return JSON.parse(String(value).replace(/&quot;/g, '"'))
  } catch (e) {
    console.error('props.j JSON parse error:', e)
    return null
  }
}

async function devAutoLogin() {
  if (!isLocalDev()) return

  const token = localStorage.getItem('token')
  if (token) return

  const user = import.meta.env.VITE_DEV_LOGIN_USER || 'its@janga.co.jp'
  const password = import.meta.env.VITE_DEV_LOGIN_PASSWORD || 'janga1'

  const result = await dataStore.login(
    {
      user,
      password,
    },
    {
      remember: true,
    }
  )

  console.log('Dev auto login result:', result)
  return result
}

watch(
  () => props.j,
  async (newValue) => {
    const p = parseParams(newValue)
    if (!p) return

    dataStore.params.attributes = p

    await devAutoLogin()
    await devAutoLogin()

    // await dataStore.get_user_register({
    //   user_id: p.user_id,
    //   user_id: p.user_id,
    // })
  },
  {
    immediate: true,
  }
)
</script>

<template>
  <v-locale-provider locale="ja">
    <div v-if="props.j">
      <MainLayout />
      <MainLayout />
    </div>

    <div v-else>
      <h4 style="color: brown;">
        必要なパラメータが設定されてない！
      </h4>
    </div>
  </v-locale-provider>
</template>