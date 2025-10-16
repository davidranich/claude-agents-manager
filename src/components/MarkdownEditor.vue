<script setup>
import { computed, ref, nextTick, watch, onMounted, onUnmounted } from 'vue';
import { useAgentStore } from '@/stores/agentStore';
import { useElectronAPI } from '@/composables/useElectronAPI';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import TurndownService from 'turndown';
import hljs from 'highlight.js/lib/core';

// Import common languages
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import css from 'highlight.js/lib/languages/css';
import html from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import markdown from 'highlight.js/lib/languages/markdown';
import yaml from 'highlight.js/lib/languages/yaml';
import ruby from 'highlight.js/lib/languages/ruby';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import cpp from 'highlight.js/lib/languages/cpp';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', html);
hljs.registerLanguage('xml', html);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c++', cpp);

const agentStore = useAgentStore();
const { writeFile } = useElectronAPI();

// Edit mode: 'markdown' or 'richtext'
const editMode = ref('markdown');

// Refs for scroll sync
const editorRef = ref(null);
const previewRef = ref(null);
const richEditorRef = ref(null);
let isSyncing = false;

// Resizable panes
const editorPaneRef = ref(null);
const previewPaneRef = ref(null);
const editorWidth = ref(50); // percentage
const isResizing = ref(false);

// Handle pane resizing
const startResize = () => {
  isResizing.value = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const handleResize = (event) => {
  if (!isResizing.value || !editorPaneRef.value) return;

  const container = editorPaneRef.value.parentElement;
  const containerRect = container.getBoundingClientRect();
  const containerWidth = containerRect.width;
  const offsetX = event.clientX - containerRect.left;
  const newWidth = (offsetX / containerWidth) * 100;

  // Constrain between 20% and 80%
  if (newWidth >= 20 && newWidth <= 80) {
    editorWidth.value = newWidth;
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';

  // Save to localStorage
  localStorage.setItem('claudeAgentsManager_editorWidth', editorWidth.value.toString());
};

// Load saved width on mount
onMounted(() => {
  const savedWidth = localStorage.getItem('claudeAgentsManager_editorWidth');
  if (savedWidth) {
    editorWidth.value = parseFloat(savedWidth);
  }

  // Add global event listeners for resize
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
});

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
});

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

// Configure marked with syntax highlighting using the new API
marked.use({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
});

// Add custom renderer for code blocks with syntax highlighting
const renderer = new marked.Renderer();
const originalCodeRenderer = renderer.code.bind(renderer);

renderer.code = function(code, infostring) {
  const lang = infostring || '';
  console.log('Rendering code block with language:', lang);

  if (lang && hljs.getLanguage(lang)) {
    try {
      const highlighted = hljs.highlight(code, { language: lang }).value;
      console.log('Successfully highlighted code');
      return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
    } catch (err) {
      console.error('Syntax highlighting error:', err);
    }
  }

  console.log('No highlighting applied, using default');
  return originalCodeRenderer(code, infostring);
};

marked.use({ renderer });

// Render markdown with sanitization
const renderMarkdown = (markdown) => {
  if (!markdown) return '';
  try {
    const rawHtml = marked.parse(markdown);
    // Configure DOMPurify to allow hljs classes for syntax highlighting
    return DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ['class'],
      ALLOWED_ATTR: ['class', 'href', 'title', 'alt', 'src'],
      KEEP_CONTENT: true
    });
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return '<p class="text-red-400">Error rendering markdown</p>';
  }
};

// Scroll synchronization - improved for fluid sync
const handleEditorScroll = () => {
  const activeEditor = editMode.value === 'markdown' ? editorRef.value : richEditorRef.value;
  if (!activeEditor || !previewRef.value || isSyncing) return;

  isSyncing = true;

  requestAnimationFrame(() => {
    const scrollPercentage = activeEditor.scrollTop / (activeEditor.scrollHeight - activeEditor.clientHeight);
    const targetScrollTop = scrollPercentage * (previewRef.value.scrollHeight - previewRef.value.clientHeight);

    previewRef.value.scrollTop = targetScrollTop;

    setTimeout(() => {
      isSyncing = false;
    }, 10);
  });
};

const handlePreviewScroll = () => {
  const activeEditor = editMode.value === 'markdown' ? editorRef.value : richEditorRef.value;
  if (!activeEditor || !previewRef.value || isSyncing) return;

  isSyncing = true;

  requestAnimationFrame(() => {
    const scrollPercentage = previewRef.value.scrollTop / (previewRef.value.scrollHeight - previewRef.value.clientHeight);
    const targetScrollTop = scrollPercentage * (activeEditor.scrollHeight - activeEditor.clientHeight);

    activeEditor.scrollTop = targetScrollTop;

    setTimeout(() => {
      isSyncing = false;
    }, 10);
  });
};

const content = computed({
  get: () => agentStore.fileContent,
  set: (value) => agentStore.updateFileContent(value)
});

// Rich text content (for contenteditable)
const richContent = ref('');
let isEditingRichText = false;

// Update rich content when file changes or mode switches (but not while actively editing)
watch([() => agentStore.fileContent, editMode], () => {
  if (editMode.value === 'richtext' && !isEditingRichText) {
    richContent.value = renderMarkdown(agentStore.fileContent);
  }
}, { immediate: true });

// Handle rich text editing
const handleRichTextInput = (event) => {
  isEditingRichText = true;
  const html = event.target.innerHTML;

  // Convert HTML back to markdown and update store
  const markdown = turndownService.turndown(html);
  agentStore.updateFileContent(markdown);

  // Reset flag after a short delay
  setTimeout(() => {
    isEditingRichText = false;
  }, 100);
};

// Toggle between edit modes
const toggleEditMode = () => {
  editMode.value = editMode.value === 'markdown' ? 'richtext' : 'markdown';
};

// WYSIWYG formatting commands
const execCommand = (command, value = null) => {
  document.execCommand(command, false, value);
  richEditorRef.value?.focus();
};

const formatBold = () => execCommand('bold');
const formatItalic = () => execCommand('italic');
const formatUnderline = () => execCommand('underline');
const formatStrikethrough = () => execCommand('strikethrough');
const formatHeading = (level) => execCommand('formatBlock', `h${level}`);
const formatOrderedList = () => execCommand('insertOrderedList');
const formatUnorderedList = () => execCommand('insertUnorderedList');
const formatBlockquote = () => execCommand('formatBlock', 'blockquote');
const formatCode = () => {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const code = document.createElement('code');
    code.textContent = range.toString();
    range.deleteContents();
    range.insertNode(code);
  }
};

const insertLink = () => {
  const url = prompt('Enter URL:');
  if (url) {
    execCommand('createLink', url);
  }
};

const insertHorizontalRule = () => {
  execCommand('insertHorizontalRule');
};

const clearFormatting = () => {
  execCommand('removeFormat');
  execCommand('unlink'); // Also remove links
};

const saveFile = async () => {
  if (!agentStore.currentFilePath) {
    console.error('No file selected');
    return;
  }

  try {
    await writeFile(agentStore.currentFilePath, agentStore.fileContent);
    agentStore.markAsSaved();
    console.log('File saved successfully');
  } catch (error) {
    console.error('Error saving file:', error);
  }
};

// Keyboard shortcuts for save and tab handling
const handleKeydown = (event) => {
  // Save shortcut (Cmd/Ctrl + S)
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault();
    saveFile();
    return;
  }

  // Tab key handling for markdown editor
  if (event.key === 'Tab' && editMode.value === 'markdown') {
    event.preventDefault();

    const textarea = event.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const spaces = '  '; // 2 spaces (you can change to '    ' for 4 spaces)

    // Insert spaces at cursor position
    const newValue =
      textarea.value.substring(0, start) +
      spaces +
      textarea.value.substring(end);

    // Update the content
    content.value = newValue;

    // Restore cursor position after the inserted spaces
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
    });
  }

  // Tab key handling for rich text editor (indent/outdent lists)
  if (event.key === 'Tab' && editMode.value === 'richtext') {
    event.preventDefault();

    if (event.shiftKey) {
      // Shift+Tab: Outdent (move list item up one level)
      document.execCommand('outdent');
    } else {
      // Tab: Indent (create nested list item)
      document.execCommand('indent');
    }

    // Trigger input event to update markdown
    if (richEditorRef.value) {
      richEditorRef.value.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
};
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-900">
    <!-- Editor Header -->
    <div class="h-14 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Editor</h2>
        <span
          v-if="agentStore.currentFileName"
          class="text-sm text-gray-600 dark:text-gray-400"
        >
          {{ agentStore.currentFileName }}
        </span>
        <span
          v-if="agentStore.hasUnsavedChanges"
          class="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded"
        >
          Unsaved
        </span>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="agentStore.selectedFile"
          @click="toggleEditMode"
          class="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          title="Toggle edit mode"
        >
          <font-awesome-icon icon="repeat" />
          Swap
        </button>
        <button
          v-if="agentStore.selectedFile"
          @click="saveFile"
          :disabled="!agentStore.hasUnsavedChanges"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 text-white rounded-lg transition-colors text-sm font-medium"
          :class="{
            'cursor-not-allowed': !agentStore.hasUnsavedChanges
          }"
        >
          Save
        </button>
      </div>
    </div>

    <!-- Editor Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Panel (Editor) -->
      <div
        ref="editorPaneRef"
        class="flex flex-col border-r border-gray-200 dark:border-gray-700"
        :style="{ width: editorWidth + '%' }"
      >
        <div class="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            {{ editMode === 'markdown' ? 'Markdown' : 'Rich Text Editor' }}
          </h3>
        </div>

        <!-- WYSIWYG Toolbar -->
        <div
          v-if="editMode === 'richtext' && agentStore.selectedFile"
          class="wysiwyg-toolbar px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-1"
        >
          <!-- Text Formatting -->
          <div class="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            <button
              @click="formatBold"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
              title="Bold (Ctrl+B)"
            >
              <font-awesome-icon icon="bold" />
            </button>
            <button
              @click="formatItalic"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
              title="Italic (Ctrl+I)"
            >
              <font-awesome-icon icon="italic" />
            </button>
            <button
              @click="formatUnderline"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
              title="Underline (Ctrl+U)"
            >
              <font-awesome-icon icon="underline" />
            </button>
            <button
              @click="formatStrikethrough"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
              title="Strikethrough"
            >
              <font-awesome-icon icon="strikethrough" />
            </button>
            <button
              @click="clearFormatting"
              class="px-2 py-1 text-xs bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded transition-colors"
              title="Clear Formatting"
            >
              <font-awesome-icon icon="eraser" />
            </button>
          </div>

          <!-- Headings -->
          <div class="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            <button
              @click="formatHeading(1)"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
              title="Heading 1"
            >
              H1
            </button>
            <button
              @click="formatHeading(2)"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
              title="Heading 2"
            >
              H2
            </button>
            <button
              @click="formatHeading(3)"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
              title="Heading 3"
            >
              H3
            </button>
          </div>

          <!-- Lists -->
          <div class="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            <button
              @click="formatUnorderedList"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
              title="Bullet List"
            >
              <font-awesome-icon icon="list-ul" />
            </button>
            <button
              @click="formatOrderedList"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
              title="Numbered List"
            >
              <font-awesome-icon icon="list-ol" />
            </button>
          </div>

          <!-- Special -->
          <div class="flex gap-1">
            <button
              @click="insertLink"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
              title="Insert Link"
            >
              <font-awesome-icon icon="link" />
            </button>
            <button
              @click="formatCode"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
              title="Code"
            >
              <font-awesome-icon icon="code" />
            </button>
            <button
              @click="formatBlockquote"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
              title="Quote"
            >
              <font-awesome-icon icon="quote-left" />
            </button>
            <button
              @click="insertHorizontalRule"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
              title="Horizontal Rule"
            >
              <font-awesome-icon icon="minus" />
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-hidden">
          <!-- Markdown Editor -->
          <textarea
            v-if="agentStore.selectedFile && editMode === 'markdown'"
            ref="editorRef"
            v-model="content"
            @keydown="handleKeydown"
            @scroll="handleEditorScroll"
            class="w-full h-full p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:outline-none leading-relaxed"
            placeholder="Start writing your agent instructions..."
            spellcheck="false"
          ></textarea>

          <!-- Rich Text Editor -->
          <div
            v-else-if="agentStore.selectedFile && editMode === 'richtext'"
            ref="richEditorRef"
            contenteditable="true"
            @input="handleRichTextInput"
            @keydown="handleKeydown"
            @scroll="handleEditorScroll"
            v-html="richContent"
            class="w-full h-full p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm overflow-y-auto focus:outline-none leading-relaxed prose prose-sm dark:prose-invert max-w-none"
            spellcheck="false"
          ></div>

          <!-- Empty State -->
          <div
            v-else
            class="flex items-center justify-center h-full text-gray-500 dark:text-gray-500"
          >
            <div class="text-center">
              <div class="mb-3">
                <font-awesome-icon icon="file-lines" size="3x" />
              </div>
              <div class="text-lg">No file selected</div>
              <div class="text-sm mt-2">Select an agent file from the sidebar to begin editing</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resize Handle -->
      <div
        @mousedown="startResize"
        class="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0"
        :class="{ 'bg-blue-500 dark:bg-blue-500': isResizing }"
      ></div>

      <!-- Right Panel (Preview) -->
      <div
        ref="previewPaneRef"
        class="flex flex-col bg-gray-50 dark:bg-gray-900"
        :style="{ width: (100 - editorWidth) + '%' }"
      >
        <div class="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            {{ editMode === 'markdown' ? 'Rich Text Preview' : 'Markdown Preview' }}
          </h3>
        </div>
        <div
          ref="previewRef"
          class="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900"
          @scroll="handlePreviewScroll"
        >
          <!-- Rich Text Preview (from Markdown) -->
          <div
            v-if="agentStore.selectedFile && agentStore.fileContent && editMode === 'markdown'"
            class="prose dark:prose-invert prose-sm max-w-none"
            v-html="renderMarkdown(agentStore.fileContent)"
          ></div>

          <!-- Markdown Preview (from Rich Text) -->
          <pre
            v-else-if="agentStore.selectedFile && agentStore.fileContent && editMode === 'richtext'"
            class="text-gray-700 dark:text-gray-300 font-mono text-xs leading-relaxed whitespace-pre-wrap"
          >{{ agentStore.fileContent }}</pre>

          <!-- Empty State -->
          <div
            v-else
            class="flex items-center justify-center h-full text-gray-500 dark:text-gray-600"
          >
            <div class="text-center">
              <div class="mb-3">
                <font-awesome-icon icon="book-open" size="3x" />
              </div>
              <div>Preview will appear here</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Contenteditable Rich Text Editor */
[contenteditable="true"] {
  outline: none;
  cursor: text;
}

[contenteditable="true"]:empty:before {
  content: "Start writing your agent instructions...";
  color: #6b7280;
}

/* WYSIWYG Toolbar Buttons */
.wysiwyg-toolbar button {
  min-width: 32px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wysiwyg-toolbar button:active {
  transform: scale(0.95);
}

.wysiwyg-toolbar button:hover {
  background-color: #4b5563;
}

.prose {
  color: #e5e7eb;
  line-height: 1.8;
}

/* Headings */
.prose h1 {
  color: #f9fafb;
  font-size: 2em;
  font-weight: bold;
  margin-top: 0;
  margin-bottom: 0.75em;
  padding-bottom: 0.3em;
  border-bottom: 2px solid #374151;
}

.prose h2 {
  color: #f9fafb;
  font-size: 1.5em;
  font-weight: bold;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  padding-bottom: 0.2em;
  border-bottom: 1px solid #374151;
}

.prose h3 {
  color: #f9fafb;
  font-size: 1.25em;
  font-weight: bold;
  margin-top: 1.25em;
  margin-bottom: 0.5em;
}

.prose h4 {
  color: #f9fafb;
  font-size: 1.1em;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

/* Paragraphs */
.prose p {
  margin-bottom: 1em;
}

/* Inline code */
.prose code {
  background-color: #2d3748;
  padding: 0.2em 0.5em;
  border-radius: 0.25em;
  font-size: 0.875em;
  color: #fbbf24;
  border: 1px solid #4a5568;
  font-weight: 600;
  font-family: 'Courier New', Courier, monospace;
}

/* Code blocks */
.prose pre {
  background-color: #f6f8fa;
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid #d0d7de;
}

.dark .prose pre {
  background-color: #1f2937;
  border-color: #374151;
}

.prose pre code {
  background-color: transparent;
  padding: 0;
  color: #24292f;
  border: none;
  font-weight: 400;
  font-size: 0.9em;
  line-height: 1.6;
}

.dark .prose pre code {
  color: #e5e7eb;
}

/* Syntax highlighting colors - Light mode */
.prose .hljs-comment,
.prose .hljs-quote {
  color: #6a737d;
  font-style: italic;
}

.prose .hljs-keyword,
.prose .hljs-selector-tag,
.prose .hljs-type,
.prose .hljs-deletion {
  color: #d73a49;
  font-weight: bold;
}

.prose .hljs-string,
.prose .hljs-attr,
.prose .hljs-addition {
  color: #032f62;
}

.prose .hljs-number,
.prose .hljs-literal,
.prose .hljs-variable,
.prose .hljs-template-variable,
.prose .hljs-link {
  color: #005cc5;
}

.prose .hljs-title,
.prose .hljs-function,
.prose .hljs-class,
.prose .hljs-title.class_ {
  color: #6f42c1;
  font-weight: bold;
}

.prose .hljs-built_in,
.prose .hljs-builtin-name,
.prose .hljs-name,
.prose .hljs-section {
  color: #e36209;
}

.prose .hljs-property,
.prose .hljs-attribute {
  color: #005cc5;
}

.prose .hljs-meta,
.prose .hljs-meta .hljs-keyword {
  color: #6f42c1;
}

.prose .hljs-punctuation,
.prose .hljs-operator {
  color: #24292f;
}

/* Syntax highlighting colors - Dark mode */
.dark .prose .hljs-comment,
.dark .prose .hljs-quote {
  color: #8b949e;
  font-style: italic;
}

.dark .prose .hljs-keyword,
.dark .prose .hljs-selector-tag,
.dark .prose .hljs-type,
.dark .prose .hljs-deletion {
  color: #ff7b72;
  font-weight: bold;
}

.dark .prose .hljs-string,
.dark .prose .hljs-attr,
.dark .prose .hljs-addition {
  color: #a5d6ff;
}

.dark .prose .hljs-number,
.dark .prose .hljs-literal,
.dark .prose .hljs-variable,
.dark .prose .hljs-template-variable,
.dark .prose .hljs-link {
  color: #79c0ff;
}

.dark .prose .hljs-title,
.dark .prose .hljs-function,
.dark .prose .hljs-class,
.dark .prose .hljs-title.class_ {
  color: #d2a8ff;
  font-weight: bold;
}

.dark .prose .hljs-built_in,
.dark .prose .hljs-builtin-name,
.dark .prose .hljs-name,
.dark .prose .hljs-section {
  color: #ffa657;
}

.dark .prose .hljs-property,
.dark .prose .hljs-attribute {
  color: #79c0ff;
}

.dark .prose .hljs-meta,
.dark .prose .hljs-meta .hljs-keyword {
  color: #d2a8ff;
}

.dark .prose .hljs-punctuation,
.dark .prose .hljs-operator {
  color: #c9d1d9;
}

/* Links */
.prose a {
  color: #60a5fa;
  text-decoration: underline;
  transition: color 0.2s;
}

.prose a:hover {
  color: #93c5fd;
}

/* Text formatting */
.prose strong {
  font-weight: bold;
  color: #f9fafb;
}

.prose em {
  font-style: italic;
}

/* Lists */
.prose ul,
.prose ol {
  margin: 1em 0;
  padding-left: 2em;
}

.prose ul {
  list-style-type: disc;
}

.prose ol {
  list-style-type: decimal;
}

.prose li {
  margin-bottom: 0.5em;
}

.prose li > ul,
.prose li > ol {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

/* Blockquotes */
.prose blockquote {
  border-left: 4px solid #60a5fa;
  padding-left: 1em;
  margin: 1em 0;
  color: #d1d5db;
  font-style: italic;
  background-color: #1f2937;
  padding: 0.75em 1em;
  border-radius: 0 0.25em 0.25em 0;
}

.prose blockquote p {
  margin: 0;
}

/* Horizontal rule */
.prose hr {
  border: none;
  border-top: 2px solid #374151;
  margin: 2em 0;
}

/* Tables */
.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.prose th {
  background-color: #374151;
  color: #f9fafb;
  font-weight: bold;
  padding: 0.75em;
  text-align: left;
  border: 1px solid #4b5563;
}

.prose td {
  padding: 0.75em;
  border: 1px solid #4b5563;
}

.prose tr:nth-child(even) {
  background-color: #1f2937;
}

/* Task lists (GitHub style) */
.prose input[type="checkbox"] {
  margin-right: 0.5em;
}
</style>
