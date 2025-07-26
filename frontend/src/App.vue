<template>
	<el-config-provider :locale="zhCn">
		<!-- 条件渲染Header组件 -->
		<Header v-if="!$route.meta.hideHeader" />
		<router-view />
	</el-config-provider>
</template>

<script setup lang="ts">
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { useThemeStore } from './store/theme';
// 导入Header组件
import Header from './components/header.vue';

const theme = useThemeStore();
theme.initTheme();
</script>
<style>
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

@import './assets/css/main.css';

/* 确保内容不会被header遮挡 */
body {
	padding-top: 70px; /* 与header高度一致 */
}
</style>
