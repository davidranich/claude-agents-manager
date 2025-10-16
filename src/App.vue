<script setup>
import { onMounted } from 'vue';
import { useTheme } from './composables/useTheme';
import { useSettings } from './composables/useSettings';

const { initTheme } = useTheme();
const { initializeSettings } = useSettings();

onMounted(() => {
  console.log('Claude Agents Manager started');
  console.log('Platform:', window.electronAPI?.platform);

  // Initialize theme
  initTheme();

  // Initialize settings (font size and color schemes)
  initializeSettings();
});
</script>

<template>
  <div class="h-screen w-screen app-bg app-text">
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

/* Use CSS custom properties for theming */
.app-bg {
  background-color: var(--color-bg, #ffffff);
}

.app-text {
  color: var(--color-text, #111827);
}

.dark .app-bg {
  background-color: var(--color-bg, #111827);
}

.dark .app-text {
  color: var(--color-text, #f9fafb);
}
</style>
