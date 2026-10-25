<script setup lang="ts">
import { useRoute } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const route = useRoute()
</script>

<template>
  <el-config-provider :locale="zhCn">
    <router-view :key="route.fullPath" />
  </el-config-provider>
</template>
