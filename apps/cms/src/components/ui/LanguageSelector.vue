<script setup lang="ts">
import { languages } from '../../utils/i18n'

defineProps<{
  modelValue: string
  translating?: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'translate'): void
}>()
</script>

<template>
  <div class="language-tabs">
    <div class="tabs-container">
      <button
        v-for="lang in languages"
        :key="lang.code"
        type="button"
        class="lang-tab"
        :class="{ active: modelValue === lang.code }"
        @click="$emit('update:modelValue', lang.code)"
      >
        {{ lang.name }} ({{ lang.code.toUpperCase() }})
      </button>
    </div>
    
    <button
      type="button"
      class="translate-btn"
      :disabled="translating"
      @click="$emit('translate')"
      title="Translate English fields to all other languages using Gemini AI"
    >
      {{ translating ? '⏳ Translating...' : '✨ Translate Form from EN' }}
    </button>
  </div>
</template>

<style scoped>
.language-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1.5px solid var(--color-border);
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.tabs-container {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs-container::-webkit-scrollbar {
  display: none;
}

.lang-tab {
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  white-space: nowrap;
  transition: none;
}

.lang-tab:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-surface-hover);
}

.lang-tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 900;
}

.translate-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-primary);
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.translate-btn:hover {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.translate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--color-bg-surface-hover);
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}
</style>
