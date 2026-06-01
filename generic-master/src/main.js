// main.js
import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import wrapper from 'vue3-webcomponent-wrapper'
import WebComponent from '@/components/top-page.ce.vue'

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'
import { ja } from 'vuetify/locale'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { VDateInput } from 'vuetify/labs/VDateInput'

const customJa = {
  ...ja,

  input: {
    ...ja.input,

    // clearable の警告対策
    clear: 'クリア',

    // 念のため不足しやすいキーも追加
    appendAction: '追加アクション',
    prependAction: '前アクション',
  },

  open: '開く',
  close: '閉じる',
}

const vuetify = createVuetify({
  components: { ...components, VDateInput },
  directives,

  locale: {
    locale: 'ja',
    fallback: 'en',
    messages: {
      ja: customJa,
    },
  },
})

const WebComponentInner = (component) => {
  const app = createApp(component)

  app.use(vuetify)
  app.use(createPinia())

  return app
}

const webComponent = wrapper(WebComponent, WebComponentInner, h)

if (!customElements.get('generic-master-system')) {
  customElements.define('generic-master-system', webComponent)
}