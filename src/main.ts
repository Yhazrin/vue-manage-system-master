import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 导入工具函数
import { setProperty } from './utils'

// 初始化pinia
const pinia = createPinia()
const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 初始化主题样式
import { useThemeStore } from './store/theme';

document.addEventListener('DOMContentLoaded', () => {
    const themeStore = useThemeStore(pinia); // 传入pinia实例
    themeStore.initTheme();
    // 设置初始背景颜色
    document.body.style.backgroundColor = themeStore.bodyBgColor;
});

// 按正确顺序注册插件
app.use(ElementPlus)
app.use(router)
app.use(pinia)

// 只保留一次挂载
app.mount('#app')
