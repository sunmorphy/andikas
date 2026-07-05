<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api, { translateText } from '../utils/api'
import BaseTable from '../components/ui/BaseTable.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import { PhPlus, PhPencilSimple, PhTrash, PhLink, PhImage as PhImageIcon, PhCopy, PhTextB, PhTextItalic, PhTextH, PhQuotes, PhListDashes, PhListNumbers, PhBracketsCurly, PhCode } from '@phosphor-icons/vue'
import LanguageSelector from '../components/ui/LanguageSelector.vue'
import { parseLocal, stringifyLocal, getDisplayLocal, defaultLang, getEmptyLocalized } from '../utils/i18n'
import { useAuthStore } from '../stores/auth'

interface Skill {
  id: string
  name: string
  icon: string
}

interface Tag {
  id: string
  name: string
  slug: string
}

interface Project {
  id: string
  title: string
  slug: string
  description: string
  type: string
  content: string
  publishedAt: string
  year?: number
  githubUrl?: string
  liveUrl?: string
  coverImage?: string
  contentImages?: string[]
  skills?: Skill[]
  skillIds?: string[]
  tags?: Tag[]
  tagIds?: string[]
  published?: boolean
  highlighted?: boolean
}

const projects = ref<Project[]>([])
const availableSkills = ref<Skill[]>([])
const availableTags = ref<Tag[]>([])
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
const authStore = useAuthStore()
const publicUrl = ref('')

// Form state
const formTitle = ref('')
const formSlug = ref('')
const formDescription = ref(getEmptyLocalized())
const formType = ref('individual')
const formContent = ref(getEmptyLocalized())
const formPublishedAt = ref(new Date().toISOString().slice(0, 16))
const formYear = ref<number | null>(null)
const formGithubUrl = ref('')
const formLiveUrl = ref('')
const formSkillIds = ref<string[]>([])
const formTagIds = ref<string[]>([])
const formPublished = ref(false)
const formHighlighted = ref(false)

const coverInput = ref<HTMLInputElement | null>(null)
const selectedCover = ref<File | null>(null)
const previewCover = ref<string | null>(null)

const contentImagesInput = ref<HTMLInputElement | null>(null)
const newContentImages = ref<File[]>([])
const existingContentImages = ref<string[]>([])

const columns = [
  { key: 'coverImage', label: 'Cover' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'publishedAt', label: 'Date' }
]

async function fetchData() {
  loading.value = true
  try {
    const [projRes, skillsRes, tagsRes] = await Promise.all([
      api.get('/projects'),
      api.get('/skills'),
      api.get('/tags')
    ])
    if (projRes.data.success) {
      projects.value = projRes.data.data.map((proj: any) => ({
        ...proj,
        skills: proj.projectSkills ? proj.projectSkills.map((ps: any) => ps.skill) : (proj.skills || []),
        tags: proj.projectTags ? proj.projectTags.map((pt: any) => pt.tag) : (proj.tags || [])
      }))
    }
    if (skillsRes.data.success) availableSkills.value = skillsRes.data.data
    if (tagsRes.data.success) availableTags.value = tagsRes.data.data
  } catch (error) {
    showMessage('Failed to load data', 'error')
  } finally {
    loading.value = false
  }
}

const fetchUploadConfig = async () => {
  try {
    const res = await api.get('/upload/config')
    if (res.data.success) {
      publicUrl.value = res.data.data.publicUrl
    }
  } catch (err) {
    console.error('Failed to load upload config', err)
  }
}

onMounted(() => {
  fetchData()
  fetchUploadConfig()
})

function openCreateModal() {
  isEditing.value = false
  currentId.value = ''
  currentLang.value = defaultLang
  formTitle.value = ''
  formSlug.value = ''
  formDescription.value = getEmptyLocalized()
  formType.value = 'individual'
  formContent.value = getEmptyLocalized()
  formPublishedAt.value = new Date().toISOString().slice(0, 16)
  formYear.value = null
  formGithubUrl.value = ''
  formLiveUrl.value = ''
  formSkillIds.value = []
  formTagIds.value = []
  formPublished.value = false
  formHighlighted.value = false

  selectedCover.value = null
  previewCover.value = null
  if (coverInput.value) coverInput.value.value = ''

  newContentImages.value = []
  existingContentImages.value = []
  if (contentImagesInput.value) contentImagesInput.value.value = ''

  showModal.value = true
}

function openEditModal(proj: Project) {
  isEditing.value = true
  currentId.value = proj.id
  currentLang.value = defaultLang
  formTitle.value = getDisplayLocal(proj.title)
  formSlug.value = proj.slug
  formDescription.value = parseLocal(proj.description)
  formType.value = proj.type || 'individual'
  formContent.value = parseLocal(proj.content)

  // Handle datetime local string format
  const pubDate = new Date(proj.publishedAt)
  const offset = pubDate.getTimezoneOffset() * 60000
  const localIso = new Date(pubDate.getTime() - offset).toISOString().slice(0, 16)
  formPublishedAt.value = localIso

  formYear.value = proj.year || null
  formGithubUrl.value = proj.githubUrl || ''
  formLiveUrl.value = proj.liveUrl || ''

  formSkillIds.value = proj.skills?.map(s => s.id) || proj.skillIds || []
  formTagIds.value = proj.tags?.map(t => t.id) || proj.tagIds || []
  formPublished.value = proj.published || false
  formHighlighted.value = proj.highlighted || false

  selectedCover.value = null
  previewCover.value = proj.coverImage || null
  if (coverInput.value) coverInput.value.value = ''

  newContentImages.value = []
  existingContentImages.value = proj.contentImages || []
  if (contentImagesInput.value) contentImagesInput.value.value = ''

  showModal.value = true
}

// Auto-generate slug from title if slug is empty
function handleTitleChange() {
  if (!isEditing.value && formTitle.value && !formSlug.value) {
    formSlug.value = formTitle.value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}

function toggleSkill(skillId: string) {
  const index = formSkillIds.value.indexOf(skillId)
  if (index === -1) {
    formSkillIds.value.push(skillId)
  } else {
    formSkillIds.value.splice(index, 1)
  }
}

function toggleTag(tagId: string) {
  const index = formTagIds.value.indexOf(tagId)
  if (index === -1) {
    formTagIds.value.push(tagId)
  } else {
    formTagIds.value.splice(index, 1)
  }
}

function handleCoverSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (file) {
      selectedCover.value = file
      previewCover.value = URL.createObjectURL(file)
    }
  }
}

function handleContentImagesSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    for (let i = 0; i < target.files.length; i++) {
      const file = target.files[i]
      if (file) {
        newContentImages.value.push(file)
      }
    }
  }
}

function removeNewContentImage(index: number) {
  newContentImages.value.splice(index, 1)
}

function removeExistingContentImage(index: number) {
  existingContentImages.value.splice(index, 1)
}

function getObjectUrl(file: File) {
  return URL.createObjectURL(file)
}

function openDeleteConfirm(id: string) {
  currentId.value = id
  showDeleteConfirm.value = true
}

async function handleSave() {
  if (!formTitle.value || !formSlug.value) {
    showMessage('Title and Slug are required', 'error')
    return
  }

  modalLoading.value = true
  message.value = { text: '', type: '' }
  try {
    const formData = new FormData()

    // Helper to treat these fields identically across languages
    const buildUniformLocal = (val: string) => {
      const obj = getEmptyLocalized()
      if (val) {
        Object.keys(obj).forEach(key => {
          (obj as any)[key] = val
        })
      }
      return stringifyLocal(obj)
    }

    formData.append('title', buildUniformLocal(formTitle.value))
    formData.append('slug', formSlug.value)
    formData.append('description', stringifyLocal(formDescription.value))
    formData.append('type', formType.value)
    formData.append('content', stringifyLocal(formContent.value))

    // Convert back to UTC ISO for server
    const pubDateUtc = new Date(formPublishedAt.value).toISOString()
    formData.append('publishedAt', pubDateUtc)

    if (formYear.value) formData.append('year', formYear.value.toString())
    formData.append('githubUrl', formGithubUrl.value)
    formData.append('liveUrl', formLiveUrl.value)

    // Form data doesn't naturally handle arrays well in some parsers, so JSON stringify for skills
    formData.append('skillIds', JSON.stringify(formSkillIds.value))
    formData.append('tagIds', JSON.stringify(formTagIds.value))
    formData.append('published', formPublished.value ? 'true' : 'false')
    formData.append('highlighted', formHighlighted.value ? 'true' : 'false')

    if (selectedCover.value) {
      formData.append('coverImage', selectedCover.value)
    }

    if (isEditing.value) {
       formData.append('existingContentImages', JSON.stringify(existingContentImages.value))
    }

    newContentImages.value.forEach(file => {
      formData.append('contentImages', file)
    })

    let result
    if (isEditing.value) {
      result = await api.put(`/projects/${currentId.value}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } else {
      result = await api.post('/projects', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    if (result.data.success) {
      showMessage(`Project ${isEditing.value ? 'updated' : 'created'} successfully!`, 'success')
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
    const { data } = await api.delete(`/projects/${currentId.value}`)
    if (data.success) {
      showMessage('Project deleted successfully', 'success')
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

  const hasEnDesc = formDescription.value.en?.trim()
  const hasEnContent = formContent.value.en?.trim()

  if (!hasEnDesc && !hasEnContent) {
    showMessage('Please fill out at least one field (Description or Content) in English before translating.', 'error')
    return
  }

  translating.value = true
  showMessage('Translating all fields from English...', 'info')
  try {
    const promises: Promise<any>[] = []
    const fieldsToUpdate: string[] = []

    if (hasEnDesc) {
      promises.push(translateText(formDescription.value.en))
      fieldsToUpdate.push('description')
    }
    if (hasEnContent) {
      promises.push(translateText(formContent.value.en))
      fieldsToUpdate.push('content')
    }

    const results = await Promise.all(promises)

    results.forEach((translatedMap, index) => {
      const field = fieldsToUpdate[index]
      if (field === 'description') {
        formDescription.value = {
          ...formDescription.value,
          ...translatedMap
        }
      } else if (field === 'content') {
        formContent.value = {
          ...formContent.value,
          ...translatedMap
        }
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

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    showMessage('Copied URL to clipboard!', 'success')
  } catch (err) {
    showMessage('Failed to copy URL', 'error')
  }
}

function getExpectedUrl(file: File): string {
  const username = authStore.user?.username || 'admin'
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const baseName = file.name.replace(/\.[^.]+$/, '')
  const imgName = `${baseName}_${date}.png`
  const sanitized = imgName
    .replace(/\s+/g, '-')
    .replace(/[^\w\-.]/g, '')
    .replace(/-+/g, '-')
    .toLowerCase()
  return `${publicUrl.value || ''}/${username}/projects/${sanitized}`
}

async function copyMarkdownToClipboard(url: string) {
  const mdString = `![Project Image](${url})`
  try {
    await navigator.clipboard.writeText(mdString)
    showMessage('Copied Markdown image code to clipboard!', 'success')
  } catch (err) {
    showMessage('Failed to copy Markdown code', 'error')
  }
}

const markdownTextarea = ref<HTMLTextAreaElement | null>(null)

function insertMarkdown(format: string) {
  const textarea = markdownTextarea.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  const selectedText = text.substring(start, end)

  let replacement = ''
  let cursorOffset = 0

  switch (format) {
    case 'bold':
      replacement = `**${selectedText || 'bold text'}**`
      cursorOffset = selectedText ? 0 : 2
      break
    case 'italic':
      replacement = `*${selectedText || 'italic text'}*`
      cursorOffset = selectedText ? 0 : 1
      break
    case 'heading':
      replacement = `\n# ${selectedText || 'Heading'}\n`
      cursorOffset = selectedText ? 0 : 2
      break
    case 'link':
      replacement = `[${selectedText || 'link text'}](https://example.com)`
      cursorOffset = selectedText ? 12 : 1
      break
    case 'code':
      replacement = `\`${selectedText || 'code'}\``
      cursorOffset = selectedText ? 0 : 1
      break
    case 'codeblock':
      replacement = `\n\`\`\`\n${selectedText || 'code'}\n\`\`\`\n`
      cursorOffset = selectedText ? 0 : 4
      break
    case 'list':
      replacement = `\n- ${selectedText || 'item'}`
      cursorOffset = selectedText ? 0 : 2
      break
    case 'numlist':
      replacement = `\n1. ${selectedText || 'item'}`
      cursorOffset = selectedText ? 0 : 3
      break
    case 'quote':
      replacement = `\n> ${selectedText || 'quote'}`
      cursorOffset = selectedText ? 0 : 2
      break
  }

  textarea.focus()

  let success = false
  try {
    success = document.execCommand('insertText', false, replacement)
  } catch (err) {
    console.error('execCommand failed', err)
  }

  if (!success) {
    const newContent = text.substring(0, start) + replacement + text.substring(end)
    formContent.value[currentLang.value] = newContent
  }

  setTimeout(() => {
    textarea.focus()
    if (selectedText) {
      textarea.setSelectionRange(start, start + replacement.length)
    } else {
      const pos = start + replacement.length - cursorOffset
      textarea.setSelectionRange(pos, pos)
    }
  }, 0)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Projects</h1>
      <BaseButton variant="primary" @click="openCreateModal">
        <PhPlus weight="bold" /> Add Project
      </BaseButton>
    </div>

    <div v-if="message.text" :class="['alert', `alert-${message.type}`]">
      {{ message.text }}
    </div>

    <BaseTable :columns="columns" :data="projects" :loading="loading">
      <template #coverImage="{ row }">
        <div class="cover-thumb">
          <img v-if="row.coverImage" :src="row.coverImage" :alt="row.title" />
          <div v-else class="no-thumb"><PhImageIcon /></div>
        </div>
      </template>

      <template #title="{ row }">
        <strong>{{ getDisplayLocal(row.title) }}</strong>
      </template>

      <template #status="{ row }">
        <div class="status-badges">
          <span class="badge" :class="row.published ? 'badge-published' : 'badge-draft'">
            {{ row.published ? 'Published' : 'Draft' }}
          </span>
          <span class="badge" :class="row.type === 'group' ? 'badge-group' : 'badge-individual'">
            {{ row.type === 'group' ? 'Group Project' : 'Individual Project' }}
          </span>
          <span v-if="row.highlighted" class="badge badge-highlighted">
            Highlighted
          </span>
        </div>
      </template>

      <template #publishedAt="{ row }">
        {{ formatDate(row.publishedAt) }}
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
      :title="isEditing ? 'Edit Project' : 'Add Project'"
      :loading="modalLoading"
      @close="showModal = false"
      @confirm="handleSave"
    >
      <div class="form-container">

        <div class="form-group cover-upload-section">
          <label>Cover Image</label>
          <div class="cover-preview-container">
            <div class="cover-preview">
              <img v-if="previewCover" :src="previewCover" alt="Preview" />
              <div v-else class="no-photo"><PhImageIcon size="32" /></div>
            </div>
            <div>
              <label for="coverImage" class="upload-label btn btn-secondary">Choose Cover...</label>
              <input type="file" id="coverImage" ref="coverInput" accept="image/*" @change="handleCoverSelect" class="file-input" />
            </div>
          </div>
        </div>

        <LanguageSelector v-model="currentLang" :translating="translating" @translate="handleAutoTranslate" />

        <div class="form-grid mt-4">
          <BaseInput id="title" label="Title" v-model="formTitle" @input="handleTitleChange" required />
          <BaseInput id="slug" label="Slug (URL)" v-model="formSlug" placeholder="my-awesome-project" required />
        </div>

        <div class="form-grid">
          <BaseInput id="publishedAt" label="Publish Date" type="datetime-local" v-model="formPublishedAt" />
          <div class="form-group">
            <label for="projectType">Project Type</label>
            <select id="projectType" v-model="formType">
              <option value="individual">Individual Project</option>
              <option value="group">Group Project</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Description / Overview <span class="required" style="color: var(--color-danger)">*</span></label>
          <textarea v-model="formDescription[currentLang]" rows="3" class="textarea" :required="currentLang === defaultLang" placeholder="A more detailed summary or overview..."></textarea>
        </div>

        <div class="form-grid">
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formPublished" />
              Published (Visible to public)
            </label>
          </div>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formHighlighted" />
              Highlighted (Featured on home page)
            </label>
          </div>
        </div>

        <div class="form-grid">
          <BaseInput id="year" label="Year" type="number" v-model.number="formYear" placeholder="e.g. 2024" />
          <BaseInput id="githubUrl" label="GitHub URL" v-model="formGithubUrl" placeholder="e.g. https://github.com/username/project" />
        </div>

        <div class="form-grid">
          <BaseInput id="liveUrl" label="Live Demo URL" v-model="formLiveUrl" placeholder="e.g. https://project.com" />
        </div>

        <div class="form-group">
          <label>Skills/Technologies</label>
          <div class="skills-grid">
            <div
              v-for="skill in availableSkills"
              :key="skill.id"
              class="skill-chip"
              :class="{ selected: formSkillIds.includes(skill.id) }"
              @click="toggleSkill(skill.id)"
            >
              <img :src="skill.icon" :alt="skill.name" class="chip-icon" />
              <span>{{ skill.name }}</span>
            </div>
          </div>
        </div>

        <div class="form-group mt-4">
          <label>Tags</label>
          <div class="skills-grid">
            <div
              v-for="tag in availableTags"
              :key="tag.id"
              class="skill-chip tag-chip"
              :class="{ selected: formTagIds.includes(tag.id) }"
              @click="toggleTag(tag.id)"
            >
              <span class="tag-hash">#</span>
              <span>{{ tag.name }}</span>
            </div>
          </div>
        </div>

        <!-- Markdown Editor -->
        <div class="form-group mt-4 borders-top pt-4">
          <label>Markdown Content <span class="required" style="color: var(--color-danger)">*</span></label>

          <div class="markdown-toolbar">
            <button type="button" class="toolbar-btn" @click.prevent="insertMarkdown('heading')" title="Heading">
              <PhTextH size="16" />
            </button>
            <button type="button" class="toolbar-btn" @click.prevent="insertMarkdown('bold')" title="Bold">
              <PhTextB size="16" />
            </button>
            <button type="button" class="toolbar-btn" @click.prevent="insertMarkdown('italic')" title="Italic">
              <PhTextItalic size="16" />
            </button>
            <div class="toolbar-separator"></div>
            <button type="button" class="toolbar-btn" @click.prevent="insertMarkdown('link')" title="Insert Link">
              <PhLink size="16" />
            </button>
            <button type="button" class="toolbar-btn" @click.prevent="insertMarkdown('code')" title="Inline Code">
              <PhCode size="16" />
            </button>
            <button type="button" class="toolbar-btn" @click.prevent="insertMarkdown('codeblock')" title="Code Block">
              <PhBracketsCurly size="16" />
            </button>
            <div class="toolbar-separator"></div>
            <button type="button" class="toolbar-btn" @click.prevent="insertMarkdown('list')" title="Bullet List">
              <PhListDashes size="16" />
            </button>
            <button type="button" class="toolbar-btn" @click.prevent="insertMarkdown('numlist')" title="Numbered List">
              <PhListNumbers size="16" />
            </button>
            <button type="button" class="toolbar-btn" @click.prevent="insertMarkdown('quote')" title="Blockquote">
              <PhQuotes size="16" />
            </button>
          </div>

          <textarea ref="markdownTextarea" v-model="formContent[currentLang]" rows="10" class="textarea markdown-editor" placeholder="# My Project\n\nWrite your content here..." :required="currentLang === defaultLang"></textarea>
          <p class="help-text text-sm">You can embed images in markdown later by using the URLs returned after saving content images.</p>
        </div>

        <!-- Content Images -->
        <div class="form-group mt-4 borders-top pt-4">
          <label>Content Images Gallery (Optional)</label>

          <div class="gallery-preview">
            <!-- Existing Images -->
            <div v-for="(imgUrl, idx) in existingContentImages" :key="'ex-'+idx" class="gallery-item">
              <img :src="imgUrl" alt="Content Image" />
              <button class="remove-img-btn" @click.prevent="removeExistingContentImage(idx)">&times;</button>
              <div class="img-actions-overlay">
                <button type="button" class="action-btn" @click.prevent="copyToClipboard(imgUrl)" title="Copy Image URL">
                  <PhLink size="16" />
                </button>
                <button type="button" class="action-btn" @click.prevent="copyMarkdownToClipboard(imgUrl)" title="Copy Markdown Tag">
                  <PhCopy size="16" />
                </button>
              </div>
            </div>

            <!-- New Images -->
            <div v-for="(file, idx) in newContentImages" :key="'new-'+idx" class="gallery-item new-item">
              <img :src="getObjectUrl(file)" alt="New Content Image" />
              <button class="remove-img-btn" @click.prevent="removeNewContentImage(idx)">&times;</button>
              <div class="new-badge">New</div>
              <div class="img-actions-overlay">
                <button type="button" class="action-btn" @click.prevent="copyToClipboard(getExpectedUrl(file))" title="Copy Expected Image URL">
                  <PhLink size="16" />
                </button>
                <button type="button" class="action-btn" @click.prevent="copyMarkdownToClipboard(getExpectedUrl(file))" title="Copy Expected Markdown Tag">
                  <PhCopy size="16" />
                </button>
              </div>
            </div>

            <label for="contentImages" class="gallery-add-btn">
              <PhPlus size="24" />
              <span>Add Images</span>
            </label>
            <input type="file" id="contentImages" ref="contentImagesInput" accept="image/*" multiple @change="handleContentImagesSelect" class="file-input" />
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
      <p>Are you sure you want to delete this project? This will also delete any associated files.</p>
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

.cover-thumb {
  width: 60px;
  height: 40px;
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-surface-hover);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-thumb {
  color: var(--color-text-tertiary);
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

/* Form Styles */
.form-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

::v-deep(.modal-content) {
  max-width: 800px;
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

.markdown-editor {
  font-family: 'Courier New', Courier, monospace;
}

.cover-upload-section {
  background-color: var(--color-bg-base);
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.cover-preview-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.cover-preview {
  width: 160px;
  height: 90px;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: var(--color-bg-surface-hover);
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-label { cursor: pointer; display: inline-block; }
.file-input { display: none; }

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
.skill-chip:hover { border-color: var(--color-text-secondary); }
.skill-chip.selected {
  background-color: rgba(59, 130, 246, 0.1);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.chip-icon { width: 16px; height: 16px; object-fit: contain; }

.tag-chip {
  padding: 0.25rem 0.75rem;
}
.tag-hash {
  color: var(--color-text-tertiary);
  font-weight: bold;
}
.tag-chip.selected .tag-hash {
  color: var(--color-primary);
}

.status-badges {
  display: flex;
  gap: 0.5rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-weight: 500;
}

.badge-published {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.badge-draft {
  background-color: var(--color-bg-surface-hover);
  color: var(--color-text-tertiary);
}

.badge-highlighted {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.badge-individual {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.badge-group {
  background-color: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.checkbox-group {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  accent-color: var(--color-primary);
}

/* Gallery */
.gallery-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
}

.gallery-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-img-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border: none;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.15s ease;
}
.remove-img-btn:hover { background-color: var(--color-danger); }

.img-actions-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  padding: 8px;
  z-index: 5;
}

.gallery-item:hover .img-actions-overlay {
  opacity: 1;
}

.img-actions-overlay .action-btn {
  background-color: rgba(255, 255, 255, 0.9);
  color: #1a1a1a;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.15s ease;
}

.img-actions-overlay .action-btn:hover {
  background-color: #ffffff;
  color: var(--color-primary);
  transform: scale(1.1);
}

.new-item { border-color: var(--color-primary); }
.new-badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background-color: var(--color-primary);
  color: white;
  font-size: 0.6rem;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
}

.gallery-add-btn {
  width: 100px;
  height: 100px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  gap: 0.5rem;
}
.gallery-add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-text-primary);
  background-color: var(--color-bg-surface-hover);
}
.gallery-add-btn span { font-size: 0.75rem; }

.mt-4 { margin-top: 1rem; }
.pt-4 { padding-top: 1rem; }
.borders-top { border-top: 1px solid var(--color-border); }
.text-sm { font-size: 0.875rem; }
.text-tertiary { color: var(--color-text-tertiary); }

/* Markdown Toolbar Styles */
.markdown-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-bottom: none;
  border-top-left-radius: var(--radius-md);
  border-top-right-radius: var(--radius-md);
  padding: 6px 12px;
  flex-wrap: wrap;
}

.markdown-editor {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}

.toolbar-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-btn:hover {
  background-color: var(--color-bg-surface-hover);
  color: var(--color-text-primary);
}

.toolbar-separator {
  width: 1px;
  height: 16px;
  background-color: var(--color-border);
  margin: 0 4px;
}
</style>
