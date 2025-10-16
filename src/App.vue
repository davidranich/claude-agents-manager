<script setup>
import { onMounted } from 'vue';
import { useTheme } from './composables/useTheme';

const { initTheme } = useTheme();

onMounted(() => {
  console.log('Claude Agents Manager started');
  console.log('Platform:', window.electronAPI?.platform);

  // Initialize theme
  initTheme();
});
</script>

<template>
  <div class="h-screen w-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <router-view />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
}
</style>
