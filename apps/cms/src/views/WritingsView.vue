<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import api, { translateText } from '../utils/api'
import { resolveMediaUrl } from '../utils/media'
import BaseTable from '../components/ui/BaseTable.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import LanguageSelector from '../components/ui/LanguageSelector.vue'
import MarkdownEditor from '../components/ui/MarkdownEditor.vue'
import {
  parseLocal,
  stringifyLocal,
  getEmptyLocalized,
  getDisplayLocal,
  type SupportedLanguage,
} from '../utils/i18n'
import {
  PhPlus,
  PhPencilSimple,
  PhTrash,
  PhCopy,
  PhImage as PhImageIcon,
  PhCheck,
  PhArticle,
} from '@phosphor-icons/vue'

interface Tag {
  id: number
  name: string
  slug: string
}

interface Article {
  id: string
  title: Record<string, string> | string
  slug: string
  description?: Record<string, string> | string | null
  content: string
  coverImage?: string | null
  published: boolean
  publishedAt?: string | null
  readingTime?: number
  articleTags?: { tag: Tag }[]
  createdAt: string
  updatedAt: string
}

const articles = ref<Article[]>([])
const tags = ref<Tag[]>([])
const loading = ref(false)
const saving = ref(false)
const translating = ref(false)
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)

// Filters & Pagination
const searchQuery = ref('')
const selectedTagFilter = ref<number | ''>('')
const statusFilter = ref<'all' | 'published' | 'draft'>('all')

// Form State
const activeLangTab = ref<SupportedLanguage>('en')
const form = ref({
  title: getEmptyLocalized(),
  slug: '',
  description: getEmptyLocalized(),
  content: '',
  readingTime: 5,
  published: false,
  tagIds: [] as number[],
})

const selectedCover = ref<File | null>(null)
const previewCover = ref<string | null>(null)

// Toast Message
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)
function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { message, type }
  setTimeout(() => {
    toast.value = null
  }, 3500)
}

const columns = [
  { key: 'cover', label: 'Cover', width: '80px' },
  { key: 'title', label: 'Title' },
  { key: 'slug', label: 'Slug' },
  { key: 'tags', label: 'Tags' },
  { key: 'readingTime', label: 'Read Time' },
  { key: 'status', label: 'Status' },
]

const filteredArticles = computed(() => {
  return articles.value.filter((art) => {
    const titleStr = typeof art.title === 'object' ? art.title?.en || '' : art.title || ''
    const matchesSearch =
      !searchQuery.value ||
      titleStr.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      art.slug.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesTag =
      selectedTagFilter.value === '' ||
      art.articleTags?.some((at) => at.tag?.id === selectedTagFilter.value)

    const matchesStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'published' && art.published) ||
      (statusFilter.value === 'draft' && !art.published)

    return matchesSearch && matchesTag && matchesStatus
  })
})

async function fetchData() {
  loading.value = true
  try {
    const [articlesRes, tagsRes] = await Promise.all([
      api.get('/articles'),
      api.get('/tags?type=writing'),
    ])

    if (articlesRes.data.success) {
      articles.value = articlesRes.data.data
    }
    if (tagsRes.data.success) {
      tags.value = tagsRes.data.data
    }
  } catch (err) {
    console.error('Failed to load articles:', err)
    showToast('Failed to load articles', 'error')
  } finally {
    loading.value = false
  }
}

function getTitleString(title: Record<string, string> | string): string {
  return getDisplayLocal(title) || 'Untitled'
}

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function handleTitleInput() {
  if (modalMode.value === 'create' && form.value.title.en) {
    form.value.slug = generateSlug(form.value.title.en)
  }
}

function openCreateModal() {
  modalMode.value = 'create'
  editingId.value = null
  form.value = {
    title: getEmptyLocalized(),
    slug: '',
    description: getEmptyLocalized(),
    content: '',
    readingTime: 5,
    published: false,
    tagIds: [],
  }
  selectedCover.value = null
  previewCover.value = null
  activeLangTab.value = 'en'
  isModalOpen.value = true
}

function openEditModal(article: Article) {
  modalMode.value = 'edit'
  editingId.value = article.id

  form.value = {
    title: parseLocal(article.title),
    slug: article.slug,
    description: parseLocal(article.description),
    content: article.content || '',
    readingTime: article.readingTime || 5,
    published: article.published,
    tagIds: article.articleTags?.map((at) => at.tag.id) || [],
  }

  selectedCover.value = null
  previewCover.value = article.coverImage || null
  activeLangTab.value = 'en'
  isModalOpen.value = true
}

async function handleAutoTranslate() {
  if (translating.value) return

  const hasEnTitle = form.value.title.en?.trim()
  const hasEnDesc = form.value.description.en?.trim()

  if (!hasEnTitle && !hasEnDesc) {
    showToast('Please enter Title or Summary in English before translating', 'error')
    return
  }

  translating.value = true
  showToast('Translating fields from English with Gemini...', 'success')
  try {
    const promises: Promise<Record<string, string>>[] = []
    const fieldsToUpdate: ('title' | 'description')[] = []

    if (hasEnTitle) {
      promises.push(translateText(form.value.title.en))
      fieldsToUpdate.push('title')
    }
    if (hasEnDesc) {
      promises.push(translateText(form.value.description.en))
      fieldsToUpdate.push('description')
    }

    const results = await Promise.all(promises)

    results.forEach((translatedMap, index) => {
      const field = fieldsToUpdate[index]
      if (field === 'title') {
        form.value.title = {
          ...form.value.title,
          ...translatedMap,
        }
      } else if (field === 'description') {
        form.value.description = {
          ...form.value.description,
          ...translatedMap,
        }
      }
    })

    showToast('Successfully translated to all languages!')
  } catch (error: any) {
    console.error('Translation failed:', error)
    showToast(error.message || 'Failed to translate fields', 'error')
  } finally {
    translating.value = false
  }
}

function handleCoverChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    selectedCover.value = file
    previewCover.value = URL.createObjectURL(file)
  }
}

function toggleTag(tagId: number) {
  const index = form.value.tagIds.indexOf(tagId)
  if (index === -1) {
    form.value.tagIds.push(tagId)
  } else {
    form.value.tagIds.splice(index, 1)
  }
}

// Markdown editor handles formatting internally via MarkdownEditor component

function copyArticleLink(slug: string) {
  const url = `https://writings.andikas.dev/${slug}`
  navigator.clipboard.writeText(url)
  showToast('Article URL copied to clipboard!')
}

async function handleSave() {
  if (!form.value.title.en) {
    showToast('English title is required', 'error')
    return
  }
  if (!form.value.slug) {
    showToast('Slug is required', 'error')
    return
  }
  if (!form.value.content) {
    showToast('Content is required', 'error')
    return
  }

  saving.value = true
  try {
    const cleanLocalized = (obj: any) => {
      const hasContent = Object.values(obj).some((v) => typeof v === 'string' && v.trim() !== '')
      if (!hasContent) return ''
      return stringifyLocal(obj)
    }

    const formData = new FormData()
    formData.append('title', stringifyLocal(form.value.title))
    formData.append('slug', form.value.slug)
    formData.append('description', cleanLocalized(form.value.description))
    formData.append('content', form.value.content)
    formData.append('readingTime', String(form.value.readingTime))
    formData.append('published', String(form.value.published))
    formData.append('tagIds', JSON.stringify(form.value.tagIds))

    if (selectedCover.value) {
      formData.append('coverImage', selectedCover.value)
    } else if (previewCover.value) {
      formData.append('coverImage', previewCover.value)
    }

    if (modalMode.value === 'create') {
      const res = await api.post('/articles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (res.data.success) {
        showToast('Article created successfully!')
        isModalOpen.value = false
        await fetchData()
      }
    } else if (editingId.value) {
      const res = await api.put(`/articles/${editingId.value}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (res.data.success) {
        showToast('Article updated successfully!')
        isModalOpen.value = false
        await fetchData()
      }
    }
  } catch (err: any) {
    console.error('Save failed:', err)
    showToast(err.response?.data?.error || 'Failed to save article', 'error')
  } finally {
    saving.value = false
  }
}

async function handleDelete(article: Article) {
  const title = getTitleString(article.title)
  if (!confirm(`Are you sure you want to delete "${title}"?`)) return

  try {
    const res = await api.delete(`/articles/${article.id}`)
    if (res.data.success) {
      showToast('Article deleted successfully')
      await fetchData()
    }
  } catch (err) {
    console.error('Delete failed:', err)
    showToast('Failed to delete article', 'error')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="writings-view">
    <!-- View Header -->
    <header class="view-header">
      <div>
        <h1>manage <span class="accent-slash">/</span> writings</h1>
        <p class="subtitle">Publish and curate essays and blog articles for writings.andikas.dev</p>
      </div>
      <BaseButton variant="primary" @click="openCreateModal">
        <PhPlus :size="16" />
        new article
      </BaseButton>
    </header>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search articles by title or slug..."
          class="search-input"
        />
      </div>

      <div class="select-group">
        <select v-model="selectedTagFilter" class="custom-select">
          <option value="">all tags</option>
          <option v-for="tag in tags" :key="tag.id" :value="tag.id">
            {{ tag.name }}
          </option>
        </select>

        <select v-model="statusFilter" class="custom-select">
          <option value="all">all status</option>
          <option value="published">published</option>
          <option value="draft">drafts</option>
        </select>
      </div>
    </div>

    <!-- Articles Table -->
    <div class="table-container">
      <BaseTable :columns="columns" :data="filteredArticles" :loading="loading">
        <template #cover="{ row }">
          <div class="cover-thumb">
            <img v-if="row.coverImage" :src="resolveMediaUrl(row.coverImage, 'articles')" :alt="getTitleString(row.title)" />
            <div v-else class="no-thumb">
              <PhArticle :size="20" />
            </div>
          </div>
        </template>

        <template #title="{ row }">
          <div class="title-cell">
            <span class="main-title">{{ getTitleString(row.title) }}</span>
          </div>
        </template>

        <template #slug="{ row }">
          <span class="slug-badge">{{ row.slug }}</span>
        </template>

        <template #tags="{ row }">
          <div class="tags-cell">
            <span v-for="at in row.articleTags" :key="at.tag.id" class="tag-pill">
              {{ at.tag.name }}
            </span>
            <span v-if="!row.articleTags?.length" class="text-muted">—</span>
          </div>
        </template>

        <template #readingTime="{ row }">
          <span>{{ row.readingTime || 5 }} min</span>
        </template>

        <template #status="{ row }">
          <span :class="['status-pill', row.published ? 'status-published' : 'status-draft']">
            {{ row.published ? 'published' : 'draft' }}
          </span>
        </template>

        <template #actions="{ row }">
          <div class="actions-cell">
            <button class="icon-btn" title="Copy public link" @click="copyArticleLink(row.slug)">
              <PhCopy :size="16" />
            </button>
            <button class="icon-btn" title="Edit article" @click="openEditModal(row)">
              <PhPencilSimple :size="16" />
            </button>
            <button class="icon-btn danger" title="Delete article" @click="handleDelete(row)">
              <PhTrash :size="16" />
            </button>
          </div>
        </template>
      </BaseTable>
    </div>

    <!-- Create / Edit Modal -->
    <BaseModal
      :show="isModalOpen"
      :title="modalMode === 'create' ? 'create / article' : 'edit / article'"
      :hide-footer="true"
      size="xl"
      @close="isModalOpen = false"
    >
      <form class="article-form" @submit.prevent="handleSave">
        <!-- Language Switcher Tab & Auto-translate -->
        <LanguageSelector
          v-model="activeLangTab"
          :translating="translating"
          @translate="handleAutoTranslate"
        />

        <!-- Title -->
        <div class="form-group">
          <label>Title ({{ activeLangTab.toUpperCase() }}) {{ activeLangTab === 'en' ? '*' : '' }}</label>
          <input
            v-model="form.title[activeLangTab]"
            type="text"
            :required="activeLangTab === 'en'"
            :placeholder="activeLangTab === 'en' ? 'e.g. Rethinking Micro-Interactions in Minimalist Design' : `Title in ${activeLangTab.toUpperCase()}...`"
            class="form-input"
            @input="activeLangTab === 'en' ? handleTitleInput() : undefined"
          />
        </div>

        <!-- Slug -->
        <div class="form-group">
          <label>Slug (URL identifier) *</label>
          <input
            v-model="form.slug"
            type="text"
            required
            pattern="^[a-z0-9-]+$"
            placeholder="e.g. rethinking-micro-interactions"
            class="form-input"
          />
          <small class="helper-text">https://writings.andikas.dev/{{ form.slug || 'your-slug' }}</small>
        </div>

        <!-- Description / Summary -->
        <div class="form-group">
          <label>Summary / SEO Description ({{ activeLangTab.toUpperCase() }})</label>
          <textarea
            v-model="form.description[activeLangTab]"
            rows="2"
            :placeholder="activeLangTab === 'en' ? 'Brief teaser for OpenGraph cards and search snippets...' : `Summary in ${activeLangTab.toUpperCase()}...`"
            class="form-textarea"
          ></textarea>
        </div>

        <!-- Row: Reading Time & Status -->
        <div class="form-row">
          <div class="form-group half">
            <label>Estimated Reading Time (minutes)</label>
            <input
              v-model.number="form.readingTime"
              type="number"
              min="1"
              max="60"
              class="form-input"
            />
          </div>

          <div class="form-group half checkbox-group">
            <label class="checkbox-label">
              <input v-model="form.published" type="checkbox" />
              <span>Publish to writings.andikas.dev</span>
            </label>
          </div>
        </div>

        <!-- Cover Image -->
        <div class="form-group">
          <label>Cover Image (Optional)</label>
          <div class="cover-uploader">
            <div v-if="previewCover" class="preview-box">
              <img :src="resolveMediaUrl(previewCover, 'articles')" alt="Cover Preview" />
            </div>
            <label class="btn-file-label">
              <PhImageIcon :size="16" />
              <span>{{ previewCover ? 'Change Cover' : 'Choose Cover Image' }}</span>
              <input type="file" accept="image/*" class="hidden-input" @change="handleCoverChange" />
            </label>
          </div>
        </div>

        <!-- Tags Selection -->
        <div class="form-group">
          <label>Tags</label>
          <div class="tags-selector">
            <button
              v-for="tag in tags"
              :key="tag.id"
              type="button"
              :class="['tag-select-pill', { selected: form.tagIds.includes(tag.id) }]"
              @click="toggleTag(tag.id)"
            >
              <PhCheck v-if="form.tagIds.includes(tag.id)" :size="12" />
              {{ tag.name }}
            </button>
          </div>
        </div>

        <!-- Content Editor with Visual & Markdown support -->
        <div class="form-group" style="margin-top: 1.25rem">
          <label style="margin-bottom: 0.5rem">
            Article Content (Markdown)
            <span class="required" style="color: var(--color-danger)">*</span>
          </label>
          <MarkdownEditor
            v-model="form.content"
            placeholder="Write your article in Markdown..."
            :required="true"
            min-height="380px"
          />
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <BaseButton variant="secondary" type="button" @click="isModalOpen = false">
            cancel
          </BaseButton>
          <BaseButton variant="primary" type="submit" :loading="saving">
            {{ modalMode === 'create' ? 'create article' : 'save changes' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Toast -->
    <div v-if="toast" :class="['toast', toast.type]">
      {{ toast.message }}
    </div>
  </div>
</template>

<style scoped>
.writings-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.view-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  margin: 0;
  text-transform: lowercase;
}

.subtitle {
  font-size: 0.875rem;
  color: #6f7477;
  margin: 0.25rem 0 0;
}

.accent-slash {
  color: #e94f37;
}

.filter-bar {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 240px;
  display: flex;
}

.search-input {
  width: 100%;
  height: 38px;
  padding: 0 0.875rem;
  font-size: 0.875rem;
  font-family: inherit;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-base);
  color: var(--color-text-primary);
  outline: none;
  box-sizing: border-box;
  line-height: normal;
}

.search-input:focus {
  border-color: var(--color-primary);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.select-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.custom-select {
  height: 38px;
  padding: 0 1.25rem 0 0.75rem;
  font-size: 0.875rem;
  font-family: inherit;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-base);
  color: var(--color-text-primary);
  outline: none;
  box-sizing: border-box;
  line-height: normal;
  cursor: pointer;
}

.custom-select:focus {
  border-color: var(--color-primary);
}

.cover-thumb {
  width: 48px;
  height: 48px;
  background-color: #e7e6e2;
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
  color: #9e9d99;
}

.title-cell {
  display: flex;
  flex-direction: column;
}

.main-title {
  font-weight: 600;
  color: #393e41;
}

.slug-badge {
  font-family: monospace;
  font-size: 0.8rem;
  color: #6f7477;
}

.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tag-pill {
  font-size: 0.75rem;
  padding: 0.15rem 0.45rem;
  background-color: #e7e6e2;
  color: #393e41;
}

.status-pill {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  text-transform: lowercase;
  font-weight: 600;
}

.status-published {
  background-color: #e6f4ea;
  color: #137333;
}

.status-draft {
  background-color: #fce8e6;
  color: #c5221f;
}

.actions-cell {
  display: flex;
  gap: 0.4rem;
}

.icon-btn {
  background: none;
  border: 1px solid #cecdc9;
  padding: 0.35rem;
  cursor: pointer;
  color: #393e41;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background-color: #e7e6e2;
}

.icon-btn.danger:hover {
  background-color: #fce8e6;
  color: #c5221f;
  border-color: #c5221f;
}

/* Modal Form Styles */
.article-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}


.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: lowercase;
  color: #393e41;
}

.form-input,
.form-textarea {
  padding: 0.6rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid #cecdc9;
  background-color: #f6f7eb;
  color: #393e41;
  border-radius: 0;
  font-family: inherit;
  outline: none;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #393e41;
}

.helper-text {
  font-size: 0.75rem;
  color: #6f7477;
  font-family: monospace;
}

.form-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.form-row .half {
  flex: 1;
}

.checkbox-group {
  display: flex;
  align-items: center;
  padding-top: 1.25rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
}

.cover-uploader {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.preview-box {
  width: 120px;
  height: 68px;
  border: 1px solid #cecdc9;
  overflow: hidden;
}

.preview-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-file-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  border: 1px solid #cecdc9;
  background-color: #e7e6e2;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
}

.hidden-input {
  display: none;
}

.tags-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag-select-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
  border: 1px solid #cecdc9;
  background-color: #f6f7eb;
  cursor: pointer;
  color: #393e41;
}

.tag-select-pill.selected {
  background-color: #393e41;
  color: #f6f7eb;
  border-color: #393e41;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.toast {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
}

.toast.success {
  background-color: #393e41;
  color: #f6f7eb;
  border-left: 4px solid #137333;
}

.toast.error {
  background-color: #393e41;
  color: #f6f7eb;
  border-left: 4px solid #c5221f;
}
</style>
