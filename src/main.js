import { createApp } from 'vue'
import App from './App.vue'
import './assets/css/reset.css'
import 'vant/lib/index.css'
import './style.scss'
import './assets/js/rem'
import { Loading, Collapse, CollapseItem, Dialog, Popover, Circle } from 'vant'

createApp(App).use(Loading).use(Collapse).use(CollapseItem).use(Dialog).use(Popover).use(Circle).mount('#app')
