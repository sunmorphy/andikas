<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api, { translateText } from '../utils/api'
import BaseTable from '../components/ui/BaseTable.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import { PhPlus, PhPencilSimple, PhTrash } from '@phosphor-icons/vue'
import LanguageSelector from '../components/ui/LanguageSelector.vue'
import { parseLocal, stringifyLocal, getDisplayLocal, defaultLang, getEmptyLocalized } from '../utils/i18n'

interface Education {
  id: string
  year: string
  institutionName: string
  degree: string
  description: string
}

const educationList = ref<Education[]>([])
const loading = ref(true)
const message = ref({ text: '', type: '' })

// Modal states
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const modalLoading = ref(false)
const isEditing = ref(false)
const currentId = ref('')
const currentLang = ref(defaultLang)
const translating = ref(false)

const form = ref({
  year: '',
  institutionName: getEmptyLocalized(),
  degree: getEmptyLocalized(),
  description: getEmptyLocalized()
})

const columns = [
  { key: 'institutionName', label: 'Institution' },
  { key: 'degree', label: 'Degree' },
  { key: 'year', label: 'Year' }
]

async function fetchData() {
  loading.value = true
  try {
    const { data } = await api.get('/education')
    if (data.success) {
      educationList.value = data.data
    }
  } catch (error) {
    showMessage('Failed to load education', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

function openCreateModal() {
  isEditing.value = false
  currentId.value = ''
  currentLang.value = defaultLang
  form.value = {
    year: '',
    institutionName: getEmptyLocalized(),
    degree: getEmptyLocalized(),
    description: getEmptyLocalized()
  }
  showModal.value = true
}

function openEditModal(edu: Education) {
  isEditing.value = true
  currentId.value = edu.id
  currentLang.value = defaultLang
  form.value = {
    year: edu.year,
    institutionName: parseLocal(edu.institutionName),
    degree: parseLocal(edu.degree),
    description: parseLocal(edu.description)
  }
  showModal.value = true
}

function openDeleteConfirm(id: string) {
  currentId.value = id
  showDeleteConfirm.value = true
}

async function handleSave() {
  if (!form.value.institutionName[defaultLang] || !form.value.degree[defaultLang] || !form.value.year) {
    showMessage(`Institution Name, Degree (${defaultLang.toUpperCase()}), and Year are required`, 'error')
    return
  }

  modalLoading.value = true
  message.value = { text: '', type: '' }
  try {
    const payload = {
      institutionName: stringifyLocal(form.value.institutionName),
      degree: stringifyLocal(form.value.degree),
      year: form.value.year,
      description: stringifyLocal(form.value.description)
    }

    let result
    if (isEditing.value) {
      result = await api.put(`/education/${currentId.value}`, payload)
    } else {
      result = await api.post('/education', payload)
    }

    if (result.data.success) {
      showMessage(`Education ${isEditing.value ? 'updated' : 'created'} successfully!`, 'success')
      showModal.value = false
      fetchData()
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
    const { data } = await api.delete(`/education/${currentId.value}`)
    if (data.success) {
      showMessage('Education deleted successfully', 'success')
      showDeleteConfirm.value = false
      fetchData()
    } else {
      showMessage(data.error || 'Failed to delete', 'error')
    }
  } catch (error: any) {
    showMessage(error.response?.data?.error || 'An error occurred', 'error')
  } finally {
    modalLoading.value = false
  }
}

async function handleAutoTranslate() {
  if (translating.value) return
  
  const hasEnInst = form.value.institutionName.en?.trim()
  const hasEnDegree = form.value.degree.en?.trim()
  const hasEnDesc = form.value.description.en?.trim()
  
  if (!hasEnInst && !hasEnDegree && !hasEnDesc) {
    showMessage('Please fill out at least one field in English before translating.', 'error')
    return
  }
  
  translating.value = true
  showMessage('Translating all fields from English...', 'info')
  try {
    const promises: Promise<any>[] = []
    const fieldsToUpdate: string[] = []
    
    if (hasEnInst) {
      promises.push(translateText(form.value.institutionName.en))
      fieldsToUpdate.push('institutionName')
    }
    if (hasEnDegree) {
      promises.push(translateText(form.value.degree.en))
      fieldsToUpdate.push('degree')
    }
    if (hasEnDesc) {
      promises.push(translateText(form.value.description.en))
      fieldsToUpdate.push('description')
    }
    
    const results = await Promise.all(promises)
    
    results.forEach((translatedMap, index) => {
      const field = fieldsToUpdate[index] as keyof typeof form.value
      (form.value as any)[field] = {
        ...(form.value as any)[field],
        ...translatedMap
      }
    })
    
    showMessage('Successfully translated all fields!', 'success')
  } catch (error: any) {
    console.error('Translation failed:', error)
    showMessage(error.message || 'Failed to translate fields', 'error')
  } finally {
    translating.value = false
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
      <h1 class="page-title">Education</h1>
      <BaseButton variant="primary" @click="openCreateModal">
        <PhPlus weight="bold" /> Add Education
      </BaseButton>
    </div>

    <div v-if="message.text" :class="['alert', `alert-${message.type}`]">
      {{ message.text }}
    </div>

    <BaseTable :columns="columns" :data="educationList" :loading="loading">
      <template #institutionName="{ row }">
        <strong>{{ getDisplayLocal(row.institutionName) }}</strong>
      </template>

      <template #degree="{ row }">
        <span class="text-secondary">{{ getDisplayLocal(row.degree) }}</span>
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
      :title="isEditing ? 'Edit Education' : 'Add Education'"
      :loading="modalLoading"
      @close="showModal = false"
      @confirm="handleSave"
    >
      <div class="form-container">
        <LanguageSelector v-model="currentLang" :translating="translating" @translate="handleAutoTranslate" />
        <BaseInput id="institutionName" label="Institution Name" v-model="form.institutionName[currentLang]" :required="currentLang === defaultLang" />
        <BaseInput id="degree" label="Degree / Program" v-model="form.degree[currentLang]" :required="currentLang === defaultLang" />
        <BaseInput id="year" label="Year (e.g. 2015-2019)" v-model="form.year" required />
        <div class="form-group mb-4">
          <label>Description</label>
          <textarea v-model="form.description[currentLang]" rows="4" class="textarea"></textarea>
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
      <p>Are you sure you want to delete this education record?</p>
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

.edit-btn { color: var(--color-text-secondary); }
.edit-btn:hover { color: var(--color-primary); background-color: rgba(59, 130, 246, 0.1); }
.delete-btn { color: var(--color-text-secondary); }
.delete-btn:hover { color: var(--color-danger); background-color: rgba(239, 68, 68, 0.1); }

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

.textarea {
  width: 100%;
  font-family: inherit;
  background-color: var(--color-bg-base);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  font-size: 0.875rem;
  resize: vertical;
}

.textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.mb-4 { margin-bottom: 1rem; }
</style>
