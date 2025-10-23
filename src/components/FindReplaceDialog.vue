<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  show: Boolean,
  mode: {
    type: String,
    default: 'find' // 'find' or 'replace'
  }
});

const emit = defineEmits(['close', 'find-next', 'find-previous', 'replace', 'replace-all', 'live-search']);

const findText = ref('');
const replaceText = ref('');
const caseSensitive = ref(false);
const currentMatch = ref(0);
const totalMatches = ref(0);

// Watch for changes in find text and trigger search
watch([findText, caseSensitive], () => {
  // Always trigger live search, even when empty (to clear highlights)
  nextTick(() => {
    emit('live-search', {
      text: findText.value,
      caseSensitive: caseSensitive.value
    });
  });
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    // Focus the find input when dialog opens
    nextTick(() => {
      const input = document.querySelector('.find-input');
      if (input) input.focus();
    });
  }
});

const handleClose = () => {
  emit('close');
};

const handleFindNext = () => {
  if (!findText.value) return;
  emit('find-next', {
    text: findText.value,
    caseSensitive: caseSensitive.value
  });
};

const handleFindPrevious = () => {
  if (!findText.value) return;
  emit('find-previous', {
    text: findText.value,
    caseSensitive: caseSensitive.value
  });
};

const handleReplace = () => {
  if (!findText.value) return;
  emit('replace', {
    find: findText.value,
    replace: replaceText.value,
    caseSensitive: caseSensitive.value
  });
};

const handleReplaceAll = () => {
  if (!findText.value) return;
  emit('replace-all', {
    find: findText.value,
    replace: replaceText.value,
    caseSensitive: caseSensitive.value
  });
};

const handleKeydown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    if (event.shiftKey) {
      handleFindPrevious();
    } else {
      handleFindNext();
    }
  } else if (event.key === 'Escape') {
    handleClose();
  }
};

// Expose methods to parent
defineExpose({
  setMatches: (current, total) => {
    currentMatch.value = current;
    totalMatches.value = total;
  }
});
</script>

<template>
  <Transition name="slide-down">
    <div
      v-if="show"
      class="fixed top-16 right-4 z-40 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-[400px]"
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ mode === 'replace' ? 'Find & Replace' : 'Find' }}
        </h3>
        <button
          @click="handleClose"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Close (Esc)"
        >
          <font-awesome-icon icon="times" />
        </button>
      </div>

      <!-- Find input -->
      <div class="mb-2">
        <div class="relative">
          <input
            v-model="findText"
            @keydown="handleKeydown"
            type="text"
            placeholder="Find..."
            class="find-input w-full px-3 py-2 pr-20 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span v-if="totalMatches > 0" class="text-xs text-gray-500 dark:text-gray-400 mr-1">
              {{ currentMatch }}/{{ totalMatches }}
            </span>
            <button
              @click="handleFindPrevious"
              class="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              title="Previous (Shift+Enter)"
              :disabled="!findText"
            >
              <font-awesome-icon icon="chevron-up" class="text-xs" />
            </button>
            <button
              @click="handleFindNext"
              class="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              title="Next (Enter)"
              :disabled="!findText"
            >
              <font-awesome-icon icon="chevron-down" class="text-xs" />
            </button>
          </div>
        </div>
      </div>

      <!-- Replace input (only in replace mode) -->
      <div v-if="mode === 'replace'" class="mb-3">
        <input
          v-model="replaceText"
          @keydown="handleKeydown"
          type="text"
          placeholder="Replace with..."
          class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      <!-- Options and buttons -->
      <div class="flex items-center justify-between">
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            v-model="caseSensitive"
            type="checkbox"
            class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-900"
          />
          <span>Case sensitive</span>
        </label>

        <div v-if="mode === 'replace'" class="flex gap-2">
          <button
            @click="handleReplace"
            class="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium"
            :disabled="!findText"
          >
            Replace
          </button>
          <button
            @click="handleReplaceAll"
            class="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium"
            :disabled="!findText"
          >
            Replace All
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
