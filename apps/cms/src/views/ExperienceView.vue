<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../utils/api'
import BaseTable from '../components/ui/BaseTable.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import { PhPlus, PhPencilSimple, PhTrash } from '@phosphor-icons/vue'
import LanguageSelector from '../components/ui/LanguageSelector.vue'
import { parseLocal, stringifyLocal, getDisplayLocal, defaultLang, getEmptyLocalized } from '../utils/i18n'

interface Skill {
  id: string
  name: string
  icon: string
}

interface Experience {
  id: string
  companyName: string
  location: string
  startYear: number
  endYear: number | null
  description: string
  skills?: Skill[]
  skillIds?: string[]
}

const experiences = ref<Experience[]>([])
const availableSkills = ref<Skill[]>([])
const loading = ref(true)
const message = ref({ text: '', type: '' })

// Modal states
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const modalLoading = ref(false)
const isEditing = ref(false)
const currentId = ref('')
const currentLang = ref(defaultLang)

const form = ref({
  companyName: getEmptyLocalized(),
  location: getEmptyLocalized(),
  startYear: new Date().getFullYear(),
  endYear: null as number | null,
  isCurrent: false,
  description: getEmptyLocalized(),
  skillIds: [] as string[]
})

const columns = [
  { key: 'companyName', label: 'Company' },
  { key: 'period', label: 'Period' },
  { key: 'location', label: 'Location' },
  { key: 'skills', label: 'Skills' }
]

async function fetchData() {
  loading.value = true
  try {
    const [expRes, skillsRes] = await Promise.all([
      api.get('/experience'),
      api.get('/skills')
    ])
    if (expRes.data.success) {
      experiences.value = expRes.data.data.map((exp: any) => ({
        ...exp,
        // Map junction table data (experienceSkills) to a flat array of skills
        skills: exp.experienceSkills ? exp.experienceSkills.map((es: any) => es.skill) : (exp.skills || [])
      }))
    }
    if (skillsRes.data.success) availableSkills.value = skillsRes.data.data
  } catch (error) {
    showMessage('Failed to load data', 'error')
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
    companyName: getEmptyLocalized(),
    location: getEmptyLocalized(),
    startYear: new Date().getFullYear(),
    endYear: null,
    isCurrent: false,
    description: getEmptyLocalized(),
    skillIds: []
  }
  showModal.value = true
}

function openEditModal(exp: Experience) {
  isEditing.value = true
  currentId.value = exp.id
  currentLang.value = defaultLang
  form.value = {
    companyName: parseLocal(exp.companyName),
    location: parseLocal(exp.location),
    startYear: exp.startYear,
    endYear: exp.endYear,
    isCurrent: exp.endYear === null,
    description: parseLocal(exp.description),
    skillIds: exp.skills?.map(s => s.id) || exp.skillIds || []
  }
  showModal.value = true
}

function toggleSkill(skillId: string) {
  const index = form.value.skillIds.indexOf(skillId)
  if (index === -1) {
    form.value.skillIds.push(skillId)
  } else {
    form.value.skillIds.splice(index, 1)
  }
}

function openDeleteConfirm(id: string) {
  currentId.value = id
  showDeleteConfirm.value = true
}

async function handleSave() {
  if (!form.value.companyName[defaultLang] || !form.value.startYear) {
    showMessage(`Company Name (${defaultLang.toUpperCase()}) and Start Year are required`, 'error')
    return
  }

  modalLoading.value = true
  message.value = { text: '', type: '' }
  try {
    const payload = {
      companyName: stringifyLocal(form.value.companyName),
      location: stringifyLocal(form.value.location),
      startYear: Number(form.value.startYear),
      endYear: form.value.isCurrent ? null : Number(form.value.endYear),
      description: stringifyLocal(form.value.description),
      skillIds: form.value.skillIds
    }

    let result
    if (isEditing.value) {
      result = await api.put(`/experience/${currentId.value}`, payload)
    } else {
      result = await api.post('/experience', payload)
    }

    if (result.data.success) {
      showMessage(`Experience ${isEditing.value ? 'updated' : 'created'} successfully!`, 'success')
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
    const { data } = await api.delete(`/experience/${currentId.value}`)
    if (data.success) {
      showMessage('Experience deleted successfully', 'success')
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
      <h1 class="page-title">Experience</h1>
      <BaseButton variant="primary" @click="openCreateModal">
        <PhPlus weight="bold" /> Add Experience
      </BaseButton>
    </div>

    <div v-if="message.text" :class="['alert', `alert-${message.type}`]">
      {{ message.text }}
    </div>

    <BaseTable :columns="columns" :data="experiences" :loading="loading">
      <template #companyName="{ row }">
        <strong>{{ getDisplayLocal(row.companyName) }}</strong>
      </template>

      <template #period="{ row }">
        {{ row.startYear }} - {{ row.endYear || 'Present' }}
      </template>

      <template #location="{ row }">
        {{ getDisplayLocal(row.location) }}
      </template>

      <template #skills="{ row }">
        <div class="skill-tags">
          <span v-for="skill in (row.skills || [])" :key="skill.id" class="skill-tag" :title="skill.name">
            <img :src="skill.icon" :alt="skill.name" />
          </span>
          <span v-if="!(row.skills?.length)" class="text-tertiary">None</span>
        </div>
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
      :title="isEditing ? 'Edit Experience' : 'Add Experience'"
      :loading="modalLoading"
      @close="showModal = false"
      @confirm="handleSave"
    >
      <div class="form-container">
        <LanguageSelector v-model="currentLang" />

        <div class="form-grid mt-4">
          <BaseInput id="company" label="Company Name" v-model="form.companyName[currentLang]" :required="currentLang === defaultLang" />
          <BaseInput id="location" label="Location" v-model="form.location[currentLang]" />
        </div>
        
        <div class="form-grid">
          <BaseInput id="startYear" label="Start Year" type="number" v-model.number="form.startYear" required />
          <div>
            <BaseInput 
              id="endYear" 
              label="End Year" 
              type="number" 
              v-model.number="form.endYear" 
              :disabled="form.isCurrent"
            />
            <label class="checkbox-label mt-2">
              <input type="checkbox" v-model="form.isCurrent" />
              <span>Current Employment</span>
            </label>
          </div>
        </div>

        <div class="form-group mb-4">
          <label>Description</label>
          <textarea v-model="form.description[currentLang]" rows="4" class="textarea"></textarea>
        </div>

        <div class="form-group">
          <label>Related Skills</label>
          <div class="skills-grid">
            <div 
              v-for="skill in availableSkills" 
              :key="skill.id"
              class="skill-chip"
              :class="{ selected: form.skillIds.includes(skill.id) }"
              @click="toggleSkill(skill.id)"
            >
              <img :src="skill.icon" :alt="skill.name" class="chip-icon" />
              <span>{{ skill.name }}</span>
            </div>
            <div v-if="availableSkills.length === 0" class="text-tertiary text-sm">
              No skills available. Add them in the Skills section first.
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
      <p>Are you sure you want to delete this experience?</p>
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

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.skill-tag {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-base);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}

.skill-tag img {
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

.mt-4 { margin-top: 1rem; }

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.mt-2 { margin-top: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.text-tertiary { color: var(--color-text-tertiary); }
.text-sm { font-size: 0.875rem; }

.skills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.skill-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background-color: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.skill-chip:hover {
  border-color: var(--color-text-secondary);
}

.skill-chip.selected {
  background-color: rgba(59, 130, 246, 0.1);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.chip-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
</style>
