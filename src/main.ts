import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme'
import { enablePersianDigitsAutoConversion } from './utils/persian-digits-observer'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// اعمال حالت روشن/تیره/سیستم قبل از mount تا از پرش رنگی (flash) صفحه جلوگیری شود.
useThemeStore(pinia).init()

app.mount('#app')

const appRoot = document.getElementById('app')
if (appRoot) {
  enablePersianDigitsAutoConversion(appRoot)
}
