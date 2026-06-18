<script setup lang="ts">
defineProps<{
  label?: string
  modelValue: string | number | null
  type?: string
  id?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div class="form-group">
    <label v-if="label" :for="id">{{ label }} <span v-if="required" class="required">*</span></label>
    <input
      :id="id"
      :type="type || 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :class="{ 'has-error': !!error }"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="error" class="error-msg">{{ error }}</span>
  </div>
</template>

<style scoped>
.required {
  color: var(--color-danger);
}
.has-error {
  border-color: var(--color-danger) !important;
}
.error-msg {
  color: var(--color-danger);
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-top: 0.35rem;
}
</style>
