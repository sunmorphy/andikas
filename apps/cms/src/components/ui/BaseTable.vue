<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  columns: { key: string; label: string }[]
  data: any[]
  loading?: boolean
  draggable?: boolean
}>()

const emit = defineEmits<{
  (e: 'reorder', payload: { from: number; to: number }): void
}>()

const hasData = computed(() => props.data && props.data.length > 0)

const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onDragStart(event: DragEvent, index: number) {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', index.toString())
  }
}

function onDragEnter(event: DragEvent, index: number) {
  dragOverIndex.value = index
}

function onDrop(event: DragEvent, index: number) {
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    emit('reorder', { from: draggedIndex.value, to: index })
  }
  draggedIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  draggedIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div class="table-container">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      Loading data...
    </div>
    
    <table v-else-if="hasData" class="base-table">
      <thead>
        <tr>
          <th v-if="draggable" class="drag-handle-col"></th>
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
          <th v-if="$slots.actions" class="actions-col">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="(row, index) in data" 
          :key="row.id || index"
          :draggable="draggable"
          @dragstart="onDragStart($event, index)"
          @dragover.prevent
          @dragenter="onDragEnter($event, index)"
          @drop="onDrop($event, index)"
          @dragend="onDragEnd"
          :class="{ 
            'draggable-row': draggable,
            'is-dragging': draggedIndex === index,
            'drag-over': dragOverIndex === index && draggedIndex !== index
          }"
        >
          <td v-if="draggable" class="drag-handle-cell">
            <svg class="drag-handle-icon" viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M8.5 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-10 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-10 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
            </svg>
          </td>
          <td v-for="col in columns" :key="col.key">
            <slot :name="col.key" :row="row">
              {{ row[col.key] }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="actions-col">
            <slot name="actions" :row="row"></slot>
          </td>
        </tr>
      </tbody>
    </table>
    
    <div v-else class="empty-state">
      <slot name="empty">
        <p>No records found.</p>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-base);
}

.base-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.base-table th,
.base-table td {
  padding: 1.2rem 1rem;
  border-bottom: 1.5px solid var(--color-border);
}

.base-table th {
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  border-bottom: 2px solid var(--color-text-primary); /* Stark separator */
}

.base-table tr:hover td {
  background-color: var(--color-bg-surface-hover);
}

.actions-col {
  text-align: right;
  width: 120px;
}

.loading-state, .empty-state {
  padding: 4rem;
  text-align: center;
  color: var(--color-text-tertiary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.drag-handle-col {
  width: 40px;
}

.drag-handle-cell {
  width: 40px;
  text-align: center;
  cursor: grab;
  color: var(--color-text-tertiary);
}

.drag-handle-cell:active {
  cursor: grabbing;
}

.drag-handle-icon {
  opacity: 0.4;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.draggable-row:hover .drag-handle-icon {
  opacity: 1;
  color: var(--color-primary);
}

.is-dragging {
  opacity: 0.4;
  background-color: var(--color-bg-surface-hover) !important;
}

.drag-over {
  border-top: 2px solid var(--color-primary) !important;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
