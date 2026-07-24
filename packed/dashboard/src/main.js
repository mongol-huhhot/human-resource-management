import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vuetify from "./plugins/vuetify";
import App from './App.vue'
import Snackbar from "@/utils/Snackbar.vue"; // Abstracted notification utility
import i18n from './i18n'
import 'flag-icons/css/flag-icons.min.css'

const app = createApp(App)

app.use(createPinia())
app.use(vuetify)
app.component('Snackbar', Snackbar);
app.use(i18n);

app.config.globalProperties.$Snackbar = Snackbar;

app.mount("#app");

// Listen for lang changes from other frames
window.addEventListener('storage', (e) => {
  if (e.key === 'lang' && e.newValue !== i18n.global.locale.value) {
    i18n.global.locale.value = e.newValue
  }
})

// app.mount('#app')
