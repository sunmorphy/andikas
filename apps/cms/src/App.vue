<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import api from './utils/api'
import { setPublicImageHost, setPublicMediaPrefix } from './utils/media'

onMounted(async () => {
  try {
    const { data } = await api.get('/upload/config')
    if (data?.success && data?.data) {
      if (data.data.publicUrl) {
        setPublicImageHost(data.data.publicUrl)
      }
      if (data.data.mediaPrefix) {
        setPublicMediaPrefix(data.data.mediaPrefix)
      }
    }
  } catch {
    // Ignore error if not authenticated or offline, env fallback will be used
  }
})
</script>

<template>
  <RouterView />
</template>

<style scoped>
</style>
