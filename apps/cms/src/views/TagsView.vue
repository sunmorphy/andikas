<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '../utils/api'
import BaseTable from '../components/ui/BaseTable.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import { PhPlus, PhPencilSimple, PhTrash } from '@phosphor-icons/vue'

interface Tag {
  id: string | number
  name: string
  slug: string
  type: 'project' | 'writing'
  createdAt: string
  updatedAt: string
}

const tags = ref<Tag[]>([])
const loading = ref(true)
const message = ref({ text: '', type: '' })
const activeTypeFilter = ref<'all' | 'project' | 'writing'>('all')

const filteredTags = computed(() => {
  if (activeTypeFilter.value === 'all') return tags.value
  return tags.value.filter((t) => (t.type || 'project') === activeTypeFilter.value)
})

// Modal states
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const modalLoading = ref(false)
const isEditing = ref(false)
const currentTagId = ref<string | number>('')

const form = ref({
  name: '',
  slug: '',
  type: 'project' as 'project' | 'writing',
})

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'type', label: 'Type' },
]

async function fetchTags() {
  loading.value = true
  try {
    const { data } = await api.get('/tags')
    if (data.success) {
      tags.value = data.data
    }
  } catch (error) {
    showMessage('Failed to load tags', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTags()
})

function openCreateModal() {
  isEditing.value = false
  currentTagId.value = ''
  form.value.name = ''
  form.value.slug = ''
  form.value.type = activeTypeFilter.value === 'writing' ? 'writing' : 'project'
  showModal.value = true
}

function openEditModal(tag: Tag) {
  isEditing.value = true
  currentTagId.value = tag.id
  form.value.name = tag.name
  form.value.slug = tag.slug
  form.value.type = tag.type || 'project'
  showModal.value = true
}

function openDeleteConfirm(id: string | number) {
  currentTagId.value = id
  showDeleteConfirm.value = true
}

// Auto-generate slug from name if slug is empty
function handleNameChange() {
  if (!isEditing.value && form.value.name && !form.value.slug) {
    form.value.slug = form.value.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}

async function handleSave() {
  if (!form.value.name) {
    showMessage('Name is required', 'error')
    return
  }
  if (!form.value.slug) {
    showMessage('Slug is required', 'error')
    return
  }

  modalLoading.value = true
  message.value = { text: '', type: '' }
  try {
    const payload = {
      name: form.value.name,
      slug: form.value.slug,
      type: form.value.type,
    }

    let result
    if (isEditing.value) {
      result = await api.put(`/tags/${currentTagId.value}`, payload)
    } else {
      result = await api.post('/tags', payload)
    }

    if (result.data.success) {
      showMessage(`Tag ${isEditing.value ? 'updated' : 'created'} successfully!`, 'success')
      showModal.value = false
      fetchTags()
    } else {
      showMessage(result.data.error || 'Failed to save', 'error')
    }
  } catch (error: any) {
    showMessage(error.response?.data?.error || 'An error occurred', 'error')
  } finally {
    modalLoading.value = false
  }
}

async function handleDelete() {
  modalLoading.value = true
  try {
    const { data } = await api.delete(`/tags/${currentTagId.value}`)
    if (data.success) {
      showMessage('Tag deleted successfully', 'success')
      showDeleteConfirm.value = false
      fetchTags()
    } else {
      showMessage(data.error || 'Failed to delete', 'error')
    }
  } catch (error: any) {
    showMessage(error.response?.data?.error || 'An error occurred', 'error')
  } finally {
    modalLoading.value = false
  }
}

function showMessage(text: string, type: string) {
  message.value = { text, type }
  setTimeout(() => {
    message.value = { text: '', type: '' }
  }, 5000)
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">tags</h1>
      <BaseButton variant="primary" @click="openCreateModal">
        <PhPlus weight="bold" /> add tag
      </BaseButton>
    </div>

    <div v-if="message.text" :class="['alert', `alert-${message.type}`]">
      {{ message.text }}
    </div>

    <div class="filter-bar">
      <button
        type="button"
        :class="['filter-btn', { active: activeTypeFilter === 'all' }]"
        @click="activeTypeFilter = 'all'"
      >
        all ({{ tags.length }})
      </button>
      <button
        type="button"
        :class="['filter-btn', { active: activeTypeFilter === 'project' }]"
        @click="activeTypeFilter = 'project'"
      >
        projects ({{ tags.filter((t) => (t.type || 'project') === 'project').length }})
      </button>
      <button
        type="button"
        :class="['filter-btn', { active: activeTypeFilter === 'writing' }]"
        @click="activeTypeFilter = 'writing'"
      >
        writings ({{ tags.filter((t) => t.type === 'writing').length }})
      </button>
    </div>

    <BaseTable :columns="columns" :data="filteredTags" :loading="loading">
      <template #name="{ row }">
        <strong>{{ row.name.toLowerCase() }}</strong>
      </template>

      <template #slug="{ row }">
        <span class="text-tertiary">{{ row.slug.toLowerCase() }}</span>
      </template>

      <template #type="{ row }">
        <span :class="['type-badge', `type-${row.type || 'project'}`]">
          {{ row.type || 'project' }}
        </span>
      </template>

      <template #actions="{ row }">
        <div class="action-buttons">
          <button class="icon-btn edit-btn" @click="openEditModal(row)" title="edit">
            <PhPencilSimple weight="fill" />
          </button>
          <button class="icon-btn delete-btn" @click="openDeleteConfirm(row.id)" title="delete">
            <PhTrash weight="fill" />
          </button>
        </div>
      </template>
    </BaseTable>

    <BaseModal
      :show="showModal"
      :title="isEditing ? 'edit tag' : 'add tag'"
      :loading="modalLoading"
      @close="showModal = false"
      @confirm="handleSave"
    >
      <div class="form-container">
        <BaseInput id="name" label="tag name" v-model="form.name" @input="handleNameChange" required />
        <BaseInput id="slug" label="tag slug" v-model="form.slug" placeholder="e.g. web-app" required />
        <div class="form-group">
          <label class="form-label" for="tag-type">tag type</label>
          <select id="tag-type" v-model="form.type" class="form-select">
            <option value="project">project (works)</option>
            <option value="writing">writing</option>
          </select>
        </div>
      </div>
    </BaseModal>

    <BaseModal
      :show="showDeleteConfirm"
      title="confirm delete"
      confirmText="delete"
      danger
      :loading="modalLoading"
      @close="showDeleteConfirm = false"
      @confirm="handleDelete"
    >
      <p>are you sure you want to delete this tag? this action cannot be undone.</p>
    </BaseModal>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.filter-btn {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: lowercase;
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-btn:hover {
  border-color: var(--color-text-primary);
  color: var(--color-text-primary);
}

.filter-btn.active {
  background: var(--color-text-primary);
  border-color: var(--color-text-primary);
  color: var(--color-bg-base);
}

.type-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: lowercase;
  border-radius: var(--radius-sm);
}

.type-project {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.25);
}

.type-writing {
  background-color: rgba(225, 29, 72, 0.1);
  color: #e11d48;
  border: 1px solid rgba(225, 29, 72, 0.25);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: lowercase;
  color: var(--color-text-secondary);
}

.form-select {
  padding: 0.6rem 0.8rem;
  font-size: 0.875rem;
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.form-select:focus {
  border-color: var(--color-primary);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
  display: inline-flex;
}

.edit-btn {
  color: var(--color-text-secondary);
}
.edit-btn:hover {
  color: var(--color-primary);
  background-color: rgba(59, 130, 246, 0.1);
}

.delete-btn {
  color: var(--color-text-secondary);
}
.delete-btn:hover {
  color: var(--color-danger);
  background-color: rgba(239, 68, 68, 0.1);
}

.alert {
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}
.alert-success { background-color: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
.alert-error { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.text-tertiary {
  color: var(--color-text-tertiary);
}
</style>
