<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../utils/api'
import BaseTable from '../components/ui/BaseTable.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import { PhPlus, PhPencilSimple, PhTrash } from '@phosphor-icons/vue'

interface Skill {
  id: string
  name: string
  icon: string
  createdAt: string
  updatedAt: string
}

const skills = ref<Skill[]>([])
const loading = ref(true)
const message = ref({ text: '', type: '' })

// Modal states
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const modalLoading = ref(false)
const isEditing = ref(false)
const currentSkillId = ref('')

const form = ref({
  name: ''
})
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

const columns = [
  { key: 'icon', label: 'Icon' },
  { key: 'name', label: 'Name' },
  { key: 'updatedAt', label: 'Last Updated' }
]

async function fetchSkills() {
  loading.value = true
  try {
    const { data } = await api.get('/skills')
    if (data.success) {
      skills.value = data.data
    }
  } catch (error) {
    showMessage('Failed to load skills', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSkills()
})

function openCreateModal() {
  isEditing.value = false
  currentSkillId.value = ''
  form.value.name = ''
  selectedFile.value = null
  previewUrl.value = null
  if (fileInput.value) fileInput.value.value = ''
  showModal.value = true
}

function openEditModal(skill: Skill) {
  isEditing.value = true
  currentSkillId.value = skill.id
  form.value.name = skill.name
  selectedFile.value = null
  previewUrl.value = skill.icon
  if (fileInput.value) fileInput.value.value = ''
  showModal.value = true
}

function openDeleteConfirm(id: string) {
  currentSkillId.value = id
  showDeleteConfirm.value = true
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (file) {
      selectedFile.value = file
      previewUrl.value = URL.createObjectURL(file)
    }
  }
}

async function handleSave() {
  if (!form.value.name) {
    showMessage('Name is required', 'error')
    return
  }
  if (!isEditing.value && !selectedFile.value) {
    showMessage('Icon image is required for new skills', 'error')
    return
  }

  modalLoading.value = true
  message.value = { text: '', type: '' }
  try {
    const formData = new FormData()
    formData.append('name', form.value.name)
    if (selectedFile.value) {
      formData.append('icon', selectedFile.value)
    }

    let result
    if (isEditing.value) {
      result = await api.put(`/skills/${currentSkillId.value}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } else {
      result = await api.post('/skills', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    if (result.data.success) {
      showMessage(`Skill ${isEditing.value ? 'updated' : 'created'} successfully!`, 'success')
      showModal.value = false
      fetchSkills()
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
    const { data } = await api.delete(`/skills/${currentSkillId.value}`)
    if (data.success) {
      showMessage('Skill deleted successfully', 'success')
      showDeleteConfirm.value = false
      fetchSkills()
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Skills</h1>
      <BaseButton variant="primary" @click="openCreateModal">
        <PhPlus weight="bold" /> Add Skill
      </BaseButton>
    </div>

    <div v-if="message.text" :class="['alert', `alert-${message.type}`]">
      {{ message.text }}
    </div>

    <BaseTable :columns="columns" :data="skills" :loading="loading">
      <template #icon="{ row }">
        <div class="skill-icon-wrap">
          <img :src="row.icon" :alt="row.name" class="skill-icon" />
        </div>
      </template>

      <template #name="{ row }">
        <strong>{{ row.name }}</strong>
      </template>
      
      <template #updatedAt="{ row }">
        {{ formatDate(row.updatedAt) }}
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
      :title="isEditing ? 'Edit Skill' : 'Add New Skill'"
      :loading="modalLoading"
      @close="showModal = false"
      @confirm="handleSave"
    >
      <div class="form-container">
        <BaseInput id="name" label="Skill Name" v-model="form.name" required />
        
        <div class="form-group">
          <label>Skill Icon <span v-if="!isEditing" class="required">*</span></label>
          <div class="photo-upload-container">
            <div class="icon-preview">
              <img v-if="previewUrl" :src="previewUrl" alt="Preview" />
              <div v-else class="no-photo">No Icon</div>
            </div>
            <div>
              <label for="skillIcon" class="upload-label">Select Image</label>
              <input type="file" id="skillIcon" ref="fileInput" accept="image/*" @change="handleFileSelect" class="file-input" />
              <p class="help-text">Recommended: square aspect ratio, png/svg format.</p>
            </div>
          </div>
        </div>
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
      <p>Are you sure you want to delete this skill? This action cannot be undone.</p>
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

.skill-icon-wrap {
  width: 40px;
  height: 40px;
  background-color: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.skill-icon {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
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

.photo-upload-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.icon-preview {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: var(--color-bg-surface-hover);
}

.icon-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-photo {
  color: var(--color-text-tertiary);
  font-size: 0.75rem;
  text-align: center;
}

.upload-label {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: var(--color-bg-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
}
.upload-label:hover { border-color: var(--color-text-secondary); }
.file-input { display: none; }

.required { color: var(--color-danger); }
.help-text {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  margin-top: 0.5rem;
}
</style>
