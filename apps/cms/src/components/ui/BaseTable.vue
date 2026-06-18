<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  columns: { key: string; label: string }[]
  data: any[]
  loading?: boolean
}>()

const hasData = computed(() => props.data && props.data.length > 0)
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
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
          <th v-if="$slots.actions" class="actions-col">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in data" :key="row.id || index">
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

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
