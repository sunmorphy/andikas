<script lang="ts">
type ModalCloser = () => void

// Module-level stack shared across all modal instances to handle stacked modals properly
const modalStack: ModalCloser[] = []
let isListenerAttached = false

function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' || e.key === 'Esc') {
    if (modalStack.length > 0) {
      const topCloser = modalStack[modalStack.length - 1]
      topCloser?.()
    }
  }
}

function registerModal(closer: ModalCloser) {
  modalStack.push(closer)
  if (!isListenerAttached && typeof window !== 'undefined') {
    window.addEventListener('keydown', handleGlobalKeydown)
    isListenerAttached = true
  }
  if (modalStack.length === 1 && typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden'
  }
}

function unregisterModal(closer: ModalCloser) {
  const idx = modalStack.lastIndexOf(closer)
  if (idx !== -1) {
    modalStack.splice(idx, 1)
  }
  if (modalStack.length === 0) {
    if (isListenerAttached && typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleGlobalKeydown)
      isListenerAttached = false
    }
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }
  }
}
</script>

<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'

const props = defineProps<{
  show: boolean
  title: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  danger?: boolean
  hideFooter?: boolean
  maxWidth?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  disableEsc?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()

function handleClose() {
  if (!props.loading && !props.disableEsc) {
    emit('close')
  }
}

watch(
  () => props.show,
  (show) => {
    if (show) {
      registerModal(handleClose)
    } else {
      unregisterModal(handleClose)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  unregisterModal(handleClose)
})

const modalStyle = computed(() => {
  if (props.maxWidth) {
    return { maxWidth: props.maxWidth }
  }
  switch (props.size) {
    case 'sm':
      return { maxWidth: '420px' }
    case 'md':
      return { maxWidth: '540px' }
    case 'lg':
      return { maxWidth: '800px' }
    case 'xl':
      return { maxWidth: '960px' }
    case '2xl':
      return { maxWidth: '1140px' }
    default:
      return {}
  }
})
</script>

<template>
  <div
    v-if="show"
    class="modal-backdrop"
    @click.self="handleClose"
    role="presentation"
  >
    <div
      class="modal-content card"
      :style="modalStyle"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button
          type="button"
          class="close-btn"
          @click="handleClose"
          :disabled="loading"
          aria-label="Close dialog"
          title="Close (Esc)"
        >
          &times;
        </button>
      </div>
      
      <div class="modal-body">
        <slot></slot>
      </div>

      <div v-if="!hideFooter" class="modal-footer">
        <button
          type="button"
          class="btn btn-secondary"
          @click="handleClose"
          :disabled="loading"
        >
          {{ cancelText || 'cancel' }}
        </button>
        <button 
          type="button"
          class="btn" 
          :class="danger ? 'btn-danger' : 'btn-primary'" 
          @click="$emit('confirm')"
          :disabled="loading"
        >
          <span v-if="loading" class="spinner"></span>
          {{ confirmText || 'confirm' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(57, 62, 65, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
  box-sizing: border-box;
}

.modal-content {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  border: 2px solid var(--color-text-primary); /* Stark high contrast border */
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1.5px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 900;
  text-transform: lowercase;
  letter-spacing: -0.02em;
}

.close-btn {
  font-size: 1.5rem;
  color: var(--color-text-secondary);
  line-height: 1;
}

.close-btn:hover {
  color: var(--color-text-primary);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1.5px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background-color: var(--color-bg-base);
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
