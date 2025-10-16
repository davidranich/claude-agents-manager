<script setup>
import { ref, onMounted } from 'vue';
import { useAgentStore } from '@/stores/agentStore';
import { useElectronAPI } from '@/composables/useElectronAPI';
import { useLocalStorage } from '@/composables/useLocalStorage';
import { useTerminalSettings } from '@/composables/useTerminalSettings';
import FileBrowser from '@/components/FileBrowser.vue';
import MarkdownEditor from '@/components/MarkdownEditor.vue';
import SettingsModal from '@/components/SettingsModal.vue';

const agentStore = useAgentStore();
const { selectDirectory, getAppPath, readDirectory } = useElectronAPI();
const { saveLastDirectory, getLastDirectory, clearLastDirectory } = useLocalStorage();
const { preferredTerminal, setPreferredTerminal, TERMINALS, TERMINAL_LABELS } = useTerminalSettings();

const appReady = ref(false);
const showSettings = ref(false);

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

const handleLaunchClaudeCode = async () => {
  try {
    const result = await window.electronAPI.launchClaudeCodeExternal(null, agentStore.currentDirectory, preferredTerminal.value);
    if (result.success) {
      console.log('Claude Code launched in external terminal');
    } else {
      console.error('Error launching Claude Code:', result.error);
    }
  } catch (error) {
    console.error('Error launching Claude Code:', error);
  }
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
          @click="showSettings = true"
          class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          title="Settings"
        >
          <font-awesome-icon
            icon="cog"
            class="text-gray-700 dark:text-gray-300"
          />
        </button>
      </div>

      <div class="p-4 border-b border-gray-300 dark:border-gray-700 space-y-2">
        <button
          @click="handleSelectDirectory"
          class="btn-primary w-full px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <font-awesome-icon icon="folder" />
          Select Directory
        </button>
        <button
          v-if="agentStore.currentDirectory"
          @click="handleLaunchClaudeCode"
          class="btn-secondary w-full px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
          title="Launch Claude Code in terminal"
        >
          <font-awesome-icon icon="terminal" />
          Launch Claude Code
        </button>
        <div v-if="agentStore.currentDirectory" class="space-y-1">
          <label class="text-xs text-gray-600 dark:text-gray-400 px-1">Terminal:</label>
          <select
            v-model="preferredTerminal"
            class="terminal-select w-full px-3 py-2 pr-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:outline-none transition-colors appearance-none bg-no-repeat"
            style="background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e'); background-position: right 0.5rem center; background-size: 1.25rem;"
          >
            <option
              v-for="(label, key) in TERMINAL_LABELS"
              :key="key"
              :value="key"
            >
              {{ label }}
            </option>
          </select>
        </div>
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

    <!-- Settings Modal -->
    <SettingsModal v-if="showSettings" @close="showSettings = false" />
  </div>
</template>
