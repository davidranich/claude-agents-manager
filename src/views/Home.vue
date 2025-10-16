<script setup>
import { ref, onMounted } from 'vue';
import { useAgentStore } from '@/stores/agentStore';
import { useElectronAPI } from '@/composables/useElectronAPI';
import { useLocalStorage } from '@/composables/useLocalStorage';
import { useTheme } from '@/composables/useTheme';
import FileBrowser from '@/components/FileBrowser.vue';
import MarkdownEditor from '@/components/MarkdownEditor.vue';

const agentStore = useAgentStore();
const { selectDirectory, getAppPath, readDirectory } = useElectronAPI();
const { saveLastDirectory, getLastDirectory, clearLastDirectory } = useLocalStorage();
const { currentTheme, toggleTheme } = useTheme();

const appReady = ref(false);

onMounted(async () => {
  // Initialize app
  appReady.value = true;

  // Try to load last used directory
  const lastDir = getLastDirectory();
  if (lastDir) {
    try {
      // Verify directory still exists by trying to read it
      await readDirectory(lastDir);
      agentStore.setCurrentDirectory(lastDir);
      console.log('Loaded last directory:', lastDir);
    } catch (error) {
      console.warn('Last directory no longer accessible, clearing:', error);
      clearLastDirectory();
    }
  }

  // Get default home directory
  try {
    const homePath = await getAppPath();
    console.log('Home path:', homePath);
  } catch (error) {
    console.error('Error getting app path:', error);
  }
});

const handleSelectDirectory = async () => {
  try {
    const dirPath = await selectDirectory();
    if (dirPath) {
      agentStore.setCurrentDirectory(dirPath);
      saveLastDirectory(dirPath);
      console.log('Selected directory:', dirPath);
    }
  } catch (error) {
    console.error('Error selecting directory:', error);
  }
};

const handleClearSavedDirectory = () => {
  clearLastDirectory();
  agentStore.setCurrentDirectory(null);
  agentStore.setFiles([]);
  agentStore.clearSelection();
};
</script>

<template>
  <div class="flex h-full w-full">
    <!-- Sidebar -->
    <aside class="w-72 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col">
      <div class="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Claude Agents</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Manager</p>
        </div>
        <button
          @click="toggleTheme"
          class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          :title="currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <font-awesome-icon
            :icon="currentTheme === 'dark' ? 'sun' : 'moon'"
            class="text-gray-700 dark:text-gray-300"
          />
        </button>
      </div>

      <div class="p-4 border-b border-gray-300 dark:border-gray-700 space-y-2">
        <button
          @click="handleSelectDirectory"
          class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <font-awesome-icon icon="folder" />
          Select Directory
        </button>
        <button
          v-if="agentStore.currentDirectory"
          @click="handleClearSavedDirectory"
          class="w-full px-3 py-1.5 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded transition-colors"
          title="Clear saved directory"
        >
          Clear Directory
        </button>
      </div>

      <div class="flex-1 overflow-hidden">
        <FileBrowser />
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col bg-white dark:bg-gray-900">
      <MarkdownEditor />
    </main>
  </div>
</template>
