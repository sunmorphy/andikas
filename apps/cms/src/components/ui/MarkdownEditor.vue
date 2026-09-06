<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { marked } from 'marked'
import TurndownService from 'turndown'
import {
  PhTextH,
  PhTextB,
  PhTextItalic,
  PhLink,
  PhCode,
  PhBracketsCurly,
  PhListDashes,
  PhListNumbers,
  PhQuotes,
} from '@phosphor-icons/vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    required?: boolean
    minHeight?: string
  }>(),
  {
    modelValue: '',
    placeholder: 'Write your content here...',
    required: false,
    minHeight: '280px',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

// Configure fenced code blocks
turndownService.addRule('fencedCodeBlock', {
  filter: (node, options) => {
    return (
      options.codeBlockStyle === 'fenced' &&
      node.nodeName === 'PRE' &&
      !!node.firstChild &&
      node.firstChild.nodeName === 'CODE'
    )
  },
  replacement: (_content, node) => {
    const codeNode = node.firstChild as HTMLElement
    const className = codeNode.getAttribute('class') || ''
    const match = className.match(/language-(\S+)/)
    const language = match ? match[1] : ''
    const code = codeNode.textContent || ''
    return '\n\n```' + language + '\n' + code + '\n```\n\n'
  },
})

const editorMode = ref<'visual' | 'raw'>('visual')
const editorRef = ref<HTMLDivElement | null>(null)
const rawTextareaRef = ref<HTMLTextAreaElement | null>(null)
const rawContent = ref(props.modelValue || '')
const isInternalUpdate = ref(false)

function mdToHtml(md: string): string {
  if (!md || md.trim() === '') return ''
  return marked.parse(md) as string
}

function htmlToMd(html: string): string {
  if (!html || html.trim() === '' || html === '<br>' || html === '<p><br></p>') return ''
  return turndownService.turndown(html)
}

function syncFromModel(val: string) {
  rawContent.value = val || ''
  if (editorRef.value) {
    const currentMd = htmlToMd(editorRef.value.innerHTML)
    if (currentMd.trim() !== (val || '').trim()) {
      editorRef.value.innerHTML = mdToHtml(val || '')
    }
  }
}

onMounted(() => {
  if (editorRef.value) {
    editorRef.value.innerHTML = mdToHtml(props.modelValue || '')
  }
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (isInternalUpdate.value) {
      isInternalUpdate.value = false
      return
    }
    syncFromModel(newVal)
  }
)

function onVisualInput() {
  if (!editorRef.value) return
  isInternalUpdate.value = true
  const md = htmlToMd(editorRef.value.innerHTML)
  rawContent.value = md
  emit('update:modelValue', md)
}

function onRawInput(event: Event) {
  const val = (event.target as HTMLTextAreaElement).value
  isInternalUpdate.value = true
  rawContent.value = val
  emit('update:modelValue', val)
}

function switchMode(mode: 'visual' | 'raw') {
  if (editorMode.value === mode) return
  if (mode === 'raw') {
    if (editorRef.value) {
      rawContent.value = htmlToMd(editorRef.value.innerHTML)
    }
    editorMode.value = 'raw'
    nextTick(() => rawTextareaRef.value?.focus())
  } else {
    editorMode.value = 'visual'
    nextTick(() => {
      if (editorRef.value) {
        editorRef.value.innerHTML = mdToHtml(rawContent.value)
        editorRef.value.focus()
      }
    })
  }
}

// Formatting commands
function exec(command: string, value: string | undefined = undefined) {
  if (editorMode.value === 'raw') {
    insertRawFormat(command)
    return
  }
  editorRef.value?.focus()
  document.execCommand(command, false, value)
  onVisualInput()
}

function formatHeading(level: number = 2) {
  if (editorMode.value === 'raw') {
    insertRawFormat('heading')
    return
  }
  editorRef.value?.focus()
  document.execCommand('formatBlock', false, `<h${level}>`)
  onVisualInput()
}

function formatBlockquote() {
  if (editorMode.value === 'raw') {
    insertRawFormat('quote')
    return
  }
  editorRef.value?.focus()
  document.execCommand('formatBlock', false, '<blockquote>')
  onVisualInput()
}

function formatLink() {
  if (editorMode.value === 'raw') {
    insertRawFormat('link')
    return
  }
  const url = prompt('Enter URL (https://...):', 'https://')
  if (url) {
    editorRef.value?.focus()
    document.execCommand('createLink', false, url)
    onVisualInput()
  }
}

function formatCode() {
  if (editorMode.value === 'raw') {
    insertRawFormat('code')
    return
  }
  editorRef.value?.focus()
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  const range = selection.getRangeAt(0)
  const selectedText = range.toString()
  const codeNode = document.createElement('code')
  codeNode.textContent = selectedText || 'code'
  range.deleteContents()
  range.insertNode(codeNode)
  range.setStartAfter(codeNode)
  range.setEndAfter(codeNode)
  selection.removeAllRanges()
  selection.addRange(range)
  onVisualInput()
}

function formatCodeBlock() {
  if (editorMode.value === 'raw') {
    insertRawFormat('codeblock')
    return
  }
  editorRef.value?.focus()
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  const range = selection.getRangeAt(0)
  const selectedText = range.toString()
  const preNode = document.createElement('pre')
  const codeNode = document.createElement('code')
  codeNode.textContent = selectedText || '// code here'
  preNode.appendChild(codeNode)
  range.deleteContents()
  range.insertNode(preNode)
  onVisualInput()
}

// Fallback formatting for raw textarea
function insertRawFormat(format: string) {
  const textarea = rawTextareaRef.value
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  const selectedText = text.substring(start, end)

  let replacement = ''
  let cursorOffset = 0

  switch (format) {
    case 'bold':
      replacement = `**${selectedText || 'bold text'}**`
      cursorOffset = selectedText ? 0 : 2
      break
    case 'italic':
      replacement = `*${selectedText || 'italic text'}*`
      cursorOffset = selectedText ? 0 : 1
      break
    case 'heading':
      replacement = `\n# ${selectedText || 'Heading'}\n`
      cursorOffset = selectedText ? 0 : 2
      break
    case 'link':
      replacement = `[${selectedText || 'link text'}](https://example.com)`
      cursorOffset = selectedText ? 12 : 1
      break
    case 'code':
      replacement = `\`${selectedText || 'code'}\``
      cursorOffset = selectedText ? 0 : 1
      break
    case 'codeblock':
      replacement = `\n\`\`\`\n${selectedText || 'code'}\n\`\`\`\n`
      cursorOffset = selectedText ? 0 : 4
      break
    case 'insertUnorderedList':
      replacement = `\n- ${selectedText || 'item'}`
      cursorOffset = selectedText ? 0 : 2
      break
    case 'insertOrderedList':
      replacement = `\n1. ${selectedText || 'item'}`
      cursorOffset = selectedText ? 0 : 3
      break
    case 'quote':
      replacement = `\n> ${selectedText || 'quote'}`
      cursorOffset = selectedText ? 0 : 2
      break
  }

  textarea.focus()
  let success = false
  try {
    success = document.execCommand('insertText', false, replacement)
  } catch (err) {}
  if (!success) {
    const newContent = text.substring(0, start) + replacement + text.substring(end)
    rawContent.value = newContent
    emit('update:modelValue', newContent)
  }
  setTimeout(() => {
    textarea.focus()
    if (selectedText) {
      textarea.setSelectionRange(start, start + replacement.length)
    } else {
      const pos = start + replacement.length - cursorOffset
      textarea.setSelectionRange(pos, pos)
    }
  }, 0)
}

function handleKeydown(e: KeyboardEvent) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const modKey = isMac ? e.metaKey : e.ctrlKey

  if (modKey && !e.shiftKey && !e.altKey) {
    if (e.key.toLowerCase() === 'b') {
      e.preventDefault()
      exec('bold')
      return
    }
    if (e.key.toLowerCase() === 'i') {
      e.preventDefault()
      exec('italic')
      return
    }
    if (e.key.toLowerCase() === 'k') {
      e.preventDefault()
      formatLink()
      return
    }
    if (e.key.toLowerCase() === 'e') {
      e.preventDefault()
      formatCode()
      return
    }
  }

  if (modKey && e.shiftKey && !e.altKey) {
    if (e.key.toLowerCase() === 'c') {
      e.preventDefault()
      formatCodeBlock()
      return
    }
    if (e.key.toLowerCase() === 'h') {
      e.preventDefault()
      formatHeading(2)
      return
    }
    if (e.key.toLowerCase() === 'l' || e.key.toLowerCase() === 'u') {
      e.preventDefault()
      exec('insertUnorderedList')
      return
    }
    if (e.key.toLowerCase() === 'o' || e.key === '1' || e.key === '!') {
      e.preventDefault()
      exec('insertOrderedList')
      return
    }
    if (e.key.toLowerCase() === 'q' || e.key === '>') {
      e.preventDefault()
      formatBlockquote()
      return
    }
  }

  // Handle Tab indentation in raw textarea
  if (e.key === 'Tab' && editorMode.value === 'raw') {
    e.preventDefault()
    const textarea = rawTextareaRef.value
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value
    if (!e.shiftKey) {
      document.execCommand('insertText', false, '  ')
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }
}

function handlePaste(e: ClipboardEvent) {
  if (editorMode.value === 'raw') return
  const text = e.clipboardData?.getData('text/plain')
  if (!text) return
  // If pasted text contains markdown patterns (like **bold**, ## heading, images, links), convert to HTML!
  const hasMarkdown = /(!?\[.*\]\(.*\)|\*\*|__|\*|_|```|# |> |\n- |\n\d+\. )/.test(text)
  if (hasMarkdown) {
    e.preventDefault()
    const html = marked.parse(text) as string
    document.execCommand('insertHTML', false, html)
    onVisualInput()
  }
}
</script>

<template>
  <div class="markdown-editor-wrapper">
    <!-- Toolbar -->
    <div class="markdown-toolbar">
      <div class="toolbar-actions">
        <button
          type="button"
          class="toolbar-btn"
          @click.prevent="formatHeading(2)"
          title="Heading (Cmd/Ctrl+Shift+H)"
        >
          <PhTextH :size="16" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          @click.prevent="exec('bold')"
          title="Bold (Cmd/Ctrl+B)"
        >
          <PhTextB :size="16" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          @click.prevent="exec('italic')"
          title="Italic (Cmd/Ctrl+I)"
        >
          <PhTextItalic :size="16" />
        </button>
        <div class="toolbar-separator"></div>
        <button
          type="button"
          class="toolbar-btn"
          @click.prevent="formatLink"
          title="Insert Link (Cmd/Ctrl+K)"
        >
          <PhLink :size="16" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          @click.prevent="formatCode"
          title="Inline Code (Cmd/Ctrl+E)"
        >
          <PhCode :size="16" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          @click.prevent="formatCodeBlock"
          title="Code Block (Cmd/Ctrl+Shift+C)"
        >
          <PhBracketsCurly :size="16" />
        </button>
        <div class="toolbar-separator"></div>
        <button
          type="button"
          class="toolbar-btn"
          @click.prevent="exec('insertUnorderedList')"
          title="Bullet List (Cmd/Ctrl+Shift+L)"
        >
          <PhListDashes :size="16" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          @click.prevent="exec('insertOrderedList')"
          title="Numbered List (Cmd/Ctrl+Shift+O)"
        >
          <PhListNumbers :size="16" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          @click.prevent="formatBlockquote"
          title="Blockquote (Cmd/Ctrl+Shift+Q)"
        >
          <PhQuotes :size="16" />
        </button>

        <!-- Slot for extra buttons like AI Story -->
        <slot name="toolbar-extra"></slot>
      </div>

      <!-- Mode Switcher: Visual (Preview WYSIWYG) vs Raw Markdown -->
      <div class="mode-toggle-group">
        <button
          type="button"
          class="mode-toggle-btn"
          :class="{ active: editorMode === 'visual' }"
          @click="switchMode('visual')"
          title="Edit visually with formatted preview (no markdown characters)"
        >
          visual preview
        </button>
        <button
          type="button"
          class="mode-toggle-btn"
          :class="{ active: editorMode === 'raw' }"
          @click="switchMode('raw')"
          title="Edit raw markdown syntax"
        >
          raw md
        </button>
      </div>
    </div>

    <!-- Visual Editor (contenteditable) -->
    <div
      v-show="editorMode === 'visual'"
      ref="editorRef"
      class="visual-editor"
      contenteditable="true"
      :data-placeholder="placeholder"
      :style="{ minHeight }"
      @input="onVisualInput"
      @keydown="handleKeydown"
      @paste="handlePaste"
    ></div>

    <!-- Raw Markdown Textarea (Fallback mode) -->
    <textarea
      v-show="editorMode === 'raw'"
      ref="rawTextareaRef"
      :value="rawContent"
      class="raw-markdown-editor"
      :style="{ minHeight }"
      :placeholder="placeholder"
      :required="required"
      @input="onRawInput"
      @keydown="handleKeydown"
    ></textarea>
  </div>
</template>

<style scoped>
.markdown-editor-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.markdown-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-bg-surface);
  border: 1.5px solid var(--color-border);
  border-bottom: none;
  padding: 6px 12px;
  flex-wrap: wrap;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.toolbar-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-btn:hover {
  background-color: var(--color-bg-surface-hover);
  color: var(--color-text-primary);
}

.toolbar-separator {
  width: 1px;
  height: 16px;
  background-color: var(--color-border);
  margin: 0 4px;
}

.mode-toggle-group {
  display: flex;
  gap: 0.2rem;
  background-color: var(--color-bg-surface-hover);
  padding: 0.15rem;
  border: 1px solid var(--color-border);
}

.mode-toggle-btn {
  background: none;
  border: none;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: lowercase;
  letter-spacing: -0.01em;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: none;
}

.mode-toggle-btn.active {
  background-color: var(--color-bg-surface);
  color: var(--color-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

/* Visual Editor (Preview & Direct Formatting) */
.visual-editor {
  width: 100%;
  padding: 1rem;
  font-size: 0.925rem;
  border: 1.5px solid var(--color-border);
  background-color: var(--color-bg-base);
  color: var(--color-text-primary);
  line-height: 1.6;
  outline: none;
  box-sizing: border-box;
  overflow-y: auto;
}

.visual-editor:focus {
  border-color: var(--color-primary);
}

.visual-editor:empty:before {
  content: attr(data-placeholder);
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.visual-editor :deep(h1),
.visual-editor :deep(h2),
.visual-editor :deep(h3),
.visual-editor :deep(h4) {
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-text-primary);
}

.visual-editor :deep(h1) {
  font-size: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.3rem;
}

.visual-editor :deep(h2) {
  font-size: 1.25rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.3rem;
}

.visual-editor :deep(h3) {
  font-size: 1.1rem;
}

.visual-editor :deep(p) {
  margin-bottom: 0.75rem;
  color: var(--color-text-primary);
}

.visual-editor :deep(ul),
.visual-editor :deep(ol) {
  margin-bottom: 0.75rem;
  padding-left: 2rem;
}

.visual-editor :deep(ul) {
  list-style-type: disc;
}

.visual-editor :deep(ol) {
  list-style-type: decimal;
}

.visual-editor :deep(li) {
  margin-bottom: 0.25rem;
}

.visual-editor :deep(strong),
.visual-editor :deep(b) {
  font-weight: 700;
  color: var(--color-text-primary);
}

.visual-editor :deep(em),
.visual-editor :deep(i) {
  font-style: italic;
}

.visual-editor :deep(code) {
  background-color: var(--color-bg-surface-hover);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--color-primary);
}

.visual-editor :deep(pre) {
  background-color: var(--color-bg-surface-hover);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: 1rem;
  border: 1px solid var(--color-border);
}

.visual-editor :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 0.85rem;
  color: var(--color-text-primary);
}

.visual-editor :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}

.visual-editor :deep(blockquote) {
  border-left: 4px solid var(--color-primary);
  padding-left: 1rem;
  color: var(--color-text-secondary);
  margin: 0.75rem 0;
  font-style: italic;
}

/* Raw Editor */
.raw-markdown-editor {
  width: 100%;
  padding: 1rem;
  font-family: monospace;
  font-size: 0.875rem;
  border: 1.5px solid var(--color-border);
  background-color: var(--color-bg-base);
  color: var(--color-text-primary);
  line-height: 1.5;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.raw-markdown-editor:focus {
  border-color: var(--color-primary);
}
</style>
