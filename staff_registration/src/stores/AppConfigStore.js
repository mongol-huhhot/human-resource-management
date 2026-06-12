// stores/useAppConfigStore.js
import { defineStore } from 'pinia'
/***
 * a structured global confit store.
 * in some case, we can load config from db.
 */
export const useAppConfigStore = defineStore('appConfig', {
  state: () => ({
  }),
  actions: {
    loadFromWindow() {
      // copy from window.appConfig, assuming it's already available
      Object.assign(this, window.appConfig)
    },
  }
})

// main.js
// import { useAppConfigStore } from './stores/AppConfigStore'
// const configStore = useAppConfigStore()
// configStore.loadFromWindow()
