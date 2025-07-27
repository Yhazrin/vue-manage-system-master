<template>
	<el-config-provider :locale="zhCn">
		<!-- 条件渲染Header组件 -->
		<Header v-if="!$route.meta.hideHeader" />
		<router-view /><!-- 确保这个标签存在 -->
	</el-config-provider>
</template>

<script setup lang="ts">
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { useThemeStore } from './store/theme';
// 导入Header组件
import Header from './components/header.vue';
// 导入路由相关依赖
import { watch } from 'vue';
import { useRoute } from 'vue-router';

const theme = useThemeStore();
theme.initTheme();

// 路由监听逻辑
const route = useRoute();

watch(
	() => route.meta.hideHeader,
	(hideHeader) => {
		// 根据hideHeader值动态添加/移除CSS类
		if (hideHeader) {
			document.body.classList.remove('has-header');
		} else {
			document.body.classList.add('has-header');
		}
	},
	{ immediate: true } // 初始加载时立即执行
);
</script>

<style>
/* 将@import移到最顶部 */
@import './assets/css/main.css';

/* 重置浏览器默认样式 */
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

html, body {
	height: 100%;
	width: 100%;
}

/* 仅当body有has-header类时才应用padding */
body.has-header {
	padding-top: 70px; /* 与header高度一致 */
}
</style>
