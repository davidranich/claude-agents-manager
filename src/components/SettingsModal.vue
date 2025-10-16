<script setup>
import { ref } from 'vue';
import { useSettings } from '@/composables/useSettings';
import { useTheme } from '@/composables/useTheme';

const emit = defineEmits(['close']);

const {
  fontSize,
  setFontSize,
  FONT_SIZES,
  FONT_SIZE_LABELS,
  colorSchemeLight,
  colorSchemeDark,
  setColorSchemeLight,
  setColorSchemeDark,
  COLOR_SCHEMES,
  COLOR_SCHEME_LABELS,
  COLOR_SCHEME_LABELS_LIGHT,
} = useSettings();

const { currentTheme, setTheme } = useTheme();

const activeTab = ref('appearance');

const tabs = [
  { id: 'appearance', label: 'Appearance', icon: 'sun' },
  { id: 'accessibility', label: 'Accessibility', icon: 'book-open' },
];

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      @click.self="handleClose"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[700px] max-h-[80vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <font-awesome-icon icon="cog" class="text-gray-600 dark:text-gray-400" size="lg" />
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
          </div>
          <button
            @click="handleClose"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Close settings"
          >
            <font-awesome-icon icon="times" class="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex flex-1 overflow-hidden">
          <!-- Sidebar Tabs -->
          <div class="w-48 border-r border-gray-200 dark:border-gray-700 p-2">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="w-full px-4 py-3 text-left rounded-lg transition-colors flex items-center gap-3"
              :class="activeTab === tab.id
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
            >
              <font-awesome-icon :icon="tab.icon" class="w-4" />
              <span class="text-sm">{{ tab.label }}</span>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <!-- Appearance Tab -->
            <div v-if="activeTab === 'appearance'" class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>

                <!-- Theme Toggle -->
                <div class="space-y-3">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                  <div class="flex gap-3">
                    <button
                      @click="setTheme('light')"
                      class="flex-1 px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2"
                      :class="currentTheme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'"
                    >
                      <font-awesome-icon icon="sun" />
                      <span>Light</span>
                    </button>
                    <button
                      @click="setTheme('dark')"
                      class="flex-1 px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2"
                      :class="currentTheme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'"
                    >
                      <font-awesome-icon icon="moon" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                <!-- Color Scheme Light -->
                <div class="space-y-3 mt-6">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Light Mode Color</label>
                  <div class="grid grid-cols-2 gap-3">
                    <button
                      v-for="(label, key) in COLOR_SCHEME_LABELS_LIGHT"
                      :key="key"
                      @click="setColorSchemeLight(key)"
                      class="px-4 py-3 rounded-lg border-2 transition-all text-sm"
                      :class="colorSchemeLight === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'"
                    >
                      {{ label }}
                    </button>
                  </div>
                </div>

                <!-- Color Scheme Dark -->
                <div class="space-y-3 mt-6">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode Color</label>
                  <div class="grid grid-cols-2 gap-3">
                    <button
                      v-for="(label, key) in COLOR_SCHEME_LABELS"
                      :key="key"
                      @click="setColorSchemeDark(key)"
                      class="px-4 py-3 rounded-lg border-2 transition-all text-sm"
                      :class="colorSchemeDark === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'"
                    >
                      {{ label }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Accessibility Tab -->
            <div v-if="activeTab === 'accessibility'" class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accessibility</h3>

                <!-- Font Size -->
                <div class="space-y-3">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Font Size</label>
                  <div class="grid grid-cols-2 gap-3">
                    <button
                      v-for="(label, key) in FONT_SIZE_LABELS"
                      :key="key"
                      @click="setFontSize(key)"
                      class="px-4 py-3 rounded-lg border-2 transition-all"
                      :class="fontSize === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'"
                    >
                      <span class="text-sm">{{ label }}</span>
                    </button>
                  </div>
                </div>

                <!-- Preview Text -->
                <div class="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p class="text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                  <p class="text-gray-900 dark:text-white">
                    The quick brown fox jumps over the lazy dog.
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    This is how text will appear with your current font size setting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="handleClose"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
