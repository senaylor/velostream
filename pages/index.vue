<template>
  <!-- Keeping it empty since the user is instantly redirected -->
  <div class="min-h-screen bg-[#060b13]"></div>
</template>

<script setup>
import { navigateTo } from '#app'

// Perform an immediate, SEO-friendly server-side or client-side redirect
definePageMeta({
  middleware: [
    async () => {
      return await navigateTo('/watch', { redirectCode: 302 })
    }
  ]
})
</script>