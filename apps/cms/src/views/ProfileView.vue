<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api, { translateText } from '../utils/api'
import BaseInput from '../components/ui/BaseInput.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import LanguageSelector from '../components/ui/LanguageSelector.vue'
import { PhPlusCircle, PhTrash } from '@phosphor-icons/vue'
import { parseLocal, stringifyLocal, defaultLang, getEmptyLocalized } from '../utils/i18n'
import { PDFDocument } from 'pdf-lib'

const loading = ref(true)
const saving = ref(false)
const translating = ref(false)
const message = ref({ text: '', type: '' })
const currentLang = ref(defaultLang)

const form = ref({
  name: getEmptyLocalized(),
  role: getEmptyLocalized(),
  phone: '',
  location: getEmptyLocalized(),
  description: getEmptyLocalized(),
  profilePhotoUrl: '',
  socialMedias: [] as { icon: string; url: string }[]
})

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

const resumeInput = ref<HTMLInputElement | null>(null)
const selectedResume = ref<File | null>(null)
const previewResumeUrl = ref<string | null>(null)

async function fetchProfile() {
  loading.value = true
  try {
    const { data } = await api.get('/user')
    if (data.success && data.data) {
      form.value.name = parseLocal(data.data.name)
      form.value.role = parseLocal(data.data.role)
      form.value.phone = data.data.phone || ''
      form.value.location = parseLocal(data.data.location)
      form.value.description = parseLocal(data.data.description)
      form.value.profilePhotoUrl = data.data.profilePhoto || ''
      previewResumeUrl.value = data.data.resume || null
      
      const socials = data.data.socialMedias || []
      form.value.socialMedias = socials.map((s: string) => {
        const [icon, url] = s.split('|')
        return { icon, url }
      })
    }
  } catch (error) {
    showMessage('Failed to fetch profile', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})

function addSocial() {
  form.value.socialMedias.push({ icon: 'Link', url: '' })
}

function removeSocial(index: number) {
  form.value.socialMedias.splice(index, 1)
}

async function handleAutoTranslate() {
  if (translating.value || saving.value) return
  
  const hasEnName = form.value.name.en?.trim()
  const hasEnRole = form.value.role.en?.trim()
  const hasEnLoc = form.value.location.en?.trim()
  const hasEnDesc = form.value.description.en?.trim()
  
  if (!hasEnName && !hasEnRole && !hasEnLoc && !hasEnDesc) {
    showMessage('Please fill out at least one field in English before translating.', 'error')
    return
  }
  
  translating.value = true
  showMessage('Translating all fields from English...', 'info')
  try {
    const promises: Promise<any>[] = []
    const fieldsToUpdate: string[] = []
    
    if (hasEnName) {
      promises.push(translateText(form.value.name.en))
      fieldsToUpdate.push('name')
    }
    if (hasEnRole) {
      promises.push(translateText(form.value.role.en))
      fieldsToUpdate.push('role')
    }
    if (hasEnLoc) {
      promises.push(translateText(form.value.location.en))
      fieldsToUpdate.push('location')
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

function handleResumeSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (file && file.type === 'application/pdf') {
      selectedResume.value = file
      
      // free old object URL to prevent memory leaks if selecting multiple times
      if (previewResumeUrl.value && previewResumeUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(previewResumeUrl.value)
      }
      previewResumeUrl.value = URL.createObjectURL(file)
    } else {
      showMessage('Only PDF files are allowed for resume.', 'error')
    }
  }
}

async function saveProfile() {
  saving.value = true
  message.value = { text: '', type: '' }
  try {
    const formData = new FormData()
    formData.append('name', stringifyLocal(form.value.name))
    formData.append('role', stringifyLocal(form.value.role))
    if (form.value.phone) formData.append('phone', form.value.phone)
    formData.append('location', stringifyLocal(form.value.location))
    formData.append('description', stringifyLocal(form.value.description))
    
    const validSocials = form.value.socialMedias
      .filter(s => s.icon && s.url)
      .map(s => `${s.icon}|${s.url}`)
    formData.append('socialMedias', JSON.stringify(validSocials))

    if (selectedFile.value) {
      formData.append('profilePhoto', selectedFile.value)
    }

    if (selectedResume.value) {
      try {
        const arrayBuffer = await selectedResume.value.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        const pdfBytes = await pdfDoc.save()
        const compressedFile = new File([pdfBytes as unknown as BlobPart], selectedResume.value.name, { type: 'application/pdf' })
        formData.append('resume', compressedFile)
      } catch (e) {
        console.error('PDF compression failed', e)
        formData.append('resume', selectedResume.value)
      }
    }

    const { data } = await api.put('/user', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    if (data.success) {
      showMessage('Profile updated successfully!', 'success')
      if (data.data && data.data.profilePhoto) {
         form.value.profilePhotoUrl = data.data.profilePhoto
      }
      if (data.data && data.data.resume) {
         previewResumeUrl.value = data.data.resume
      }
      selectedFile.value = null
      previewUrl.value = null
      if (fileInput.value) fileInput.value.value = ''
      
      selectedResume.value = null
      if (resumeInput.value) resumeInput.value.value = ''
    } else {
      showMessage(data.error || 'Failed to update', 'error')
    }
  } catch (error: any) {
    showMessage(error.response?.data?.error || 'An error occurred', 'error')
  } finally {
    saving.value = false
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
    <h1 class="page-title">Profile Management</h1>
    
    <div v-if="loading" class="spinner-container">
      <div class="spinner"></div>
    </div>
    
    <div v-else class="card form-container">
      <div v-if="message.text" :class="['alert', `alert-${message.type}`]">
        {{ message.text }}
      </div>

      <form @submit.prevent="saveProfile">
        <div class="header-photo">
          <div class="photo-preview">
            <img v-if="previewUrl || form.profilePhotoUrl" :src="previewUrl || form.profilePhotoUrl" alt="Profile" />
            <div v-else class="no-photo">No Photo</div>
          </div>
          <div class="photo-upload">
            <label for="profilePhoto" class="upload-label">Change Profile Photo</label>
            <input type="file" id="profilePhoto" ref="fileInput" accept="image/*" @change="handleFileSelect" class="file-input" />
          </div>
        </div>

        <div class="header-photo">
          <div class="photo-preview">
            <a v-if="previewResumeUrl" :href="previewResumeUrl" target="_blank" class="preview-link">View</a>
            <div v-else class="no-photo">No Resume</div>
          </div>
          <div class="photo-upload">
            <label for="resumeInput" class="upload-label">Change Resume (PDF)</label>
            <input type="file" id="resumeInput" ref="resumeInput" accept="application/pdf" @change="handleResumeSelect" class="file-input" />
            <p class="help-text">Resume will be compressed locally before uploading.</p>
          </div>
        </div>

        <LanguageSelector v-model="currentLang" :translating="translating" @translate="handleAutoTranslate" />

        <div class="form-grid mt-4">
          <BaseInput id="name" label="Name" v-model="form.name[currentLang]" :required="currentLang === defaultLang" />
          <BaseInput id="role" label="Role" v-model="form.role[currentLang]" :required="currentLang === defaultLang" />
        </div>

        <div class="form-grid">
          <BaseInput id="phone" label="Phone" v-model="form.phone" placeholder="+1-555-0199" />
          <BaseInput id="location" label="Location" v-model="form.location[currentLang]" placeholder="City, Country" />
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" v-model="form.description[currentLang]" rows="5" class="textarea"></textarea>
        </div>

        <div class="socials-section">
          <div class="section-header">
            <h3>Social Media Links</h3>
            <BaseButton variant="secondary" @click="addSocial">
              <PhPlusCircle weight="bold" /> Add Link
            </BaseButton>
          </div>
          
          <div v-for="(social, index) in form.socialMedias" :key="index" class="social-row">
            <BaseInput :id="`icon-${index}`" v-model="social.icon" placeholder="PhosphorIconName (e.g. GithubLogo)" />
            <BaseInput :id="`url-${index}`" v-model="social.url" placeholder="https://..." class="flex-grow" />
            <BaseButton variant="danger" @click="removeSocial(index)" class="del-btn">
              <PhTrash weight="bold" />
            </BaseButton>
          </div>
          <p v-if="form.socialMedias.length === 0" class="empty-socials">No social links added.</p>
        </div>

        <div class="form-actions">
          <BaseButton type="submit" variant="primary" :loading="saving">Save Changes</BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.spinner-container {
  display: flex;
  justify-content: center;
  padding: 4rem;
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

.form-container {
  max-width: 800px;
}

.header-photo {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.photo-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--color-bg-base);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-link {
  color: var(--color-primary);
  font-size: 0.875rem;
  text-decoration: none;
  font-weight: 500;
}
.preview-link:hover { text-decoration: underline; }

.no-photo {
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

.upload-label {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: var(--color-bg-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.upload-label:hover {
  border-color: var(--color-text-secondary);
}

.file-input {
  display: none;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.mt-4 { margin-top: 1rem; }

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

.socials-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
}

.social-row {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.flex-grow {
  flex: 1;
}

.del-btn {
  /* align with input properly when labels are missing */
  margin-top: 0;
}

.empty-socials {
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
  font-style: italic;
}

.form-actions {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.alert {
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.alert-success {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.alert-error {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.help-text {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  margin-top: 0.5rem;
}
</style>
