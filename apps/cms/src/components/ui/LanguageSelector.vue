<script setup lang="ts">
import { languages } from '../../utils/i18n'

defineProps<{
  modelValue: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div class="language-tabs">
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
</template>

<style scoped>
.language-tabs {
  display: flex;
  overflow-x: auto;
  border-bottom: 1.5px solid var(--color-border);
  margin-bottom: 1.5rem;
  scrollbar-width: none;
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
</style>
