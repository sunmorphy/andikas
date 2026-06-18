<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../utils/api'
import BaseTable from '../components/ui/BaseTable.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import { PhPlus, PhPencilSimple, PhTrash } from '@phosphor-icons/vue'

interface Tag {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

const tags = ref<Tag[]>([])
const loading = ref(true)
const message = ref({ text: '', type: '' })

// Modal states
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const modalLoading = ref(false)
const isEditing = ref(false)
const currentTagId = ref('')

const form = ref({
  name: '',
  slug: ''
})

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' }
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
  showModal.value = true
}

function openEditModal(tag: Tag) {
  isEditing.value = true
  currentTagId.value = tag.id
  form.value.name = tag.name
  form.value.slug = tag.slug
  showModal.value = true
}

function openDeleteConfirm(id: string) {
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
      slug: form.value.slug
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
      <h1 class="page-title">Tags</h1>
      <BaseButton variant="primary" @click="openCreateModal">
        <PhPlus weight="bold" /> Add Tag
      </BaseButton>
    </div>

    <div v-if="message.text" :class="['alert', `alert-${message.type}`]">
      {{ message.text }}
    </div>

    <BaseTable :columns="columns" :data="tags" :loading="loading">
      <template #name="{ row }">
        <strong>{{ row.name }}</strong>
      </template>

      <template #slug="{ row }">
        <span class="text-tertiary">{{ row.slug }}</span>
      </template>

      <template #actions="{ row }">
        <div class="action-buttons">
          <button class="icon-btn edit-btn" @click="openEditModal(row)" title="Edit">
            <PhPencilSimple weight="fill" />
          </button>
          <button class="icon-btn delete-btn" @click="openDeleteConfirm(row.id)" title="Delete">
            <PhTrash weight="fill" />
          </button>
        </div>
      </template>
    </BaseTable>

    <!-- Create/Edit Modal -->
    <BaseModal
      :show="showModal"
      :title="isEditing ? 'Edit Tag' : 'Add New Tag'"
      :loading="modalLoading"
      @close="showModal = false"
      @confirm="handleSave"
    >
      <div class="form-container">
        <BaseInput id="name" label="Tag Name" v-model="form.name" @input="handleNameChange" required />
        <BaseInput id="slug" label="Tag Slug" v-model="form.slug" placeholder="e.g. web-app" required />
      </div>
    </BaseModal>

    <!-- Delete Confirm Modal -->
    <BaseModal
      :show="showDeleteConfirm"
      title="Confirm Delete"
      confirmText="Delete"
      danger
      :loading="modalLoading"
      @close="showDeleteConfirm = false"
      @confirm="handleDelete"
    >
      <p>Are you sure you want to delete this tag? This action cannot be undone.</p>
    </BaseModal>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
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
