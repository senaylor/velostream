<template>
  <div class="max-w-5xl mx-auto p-6 space-y-6 text-white">
    <div class="max-w-5xl mx-auto p-6 space-y-6">
      <div
          v-if="pending && !asset"
          class="flex flex-col items-center justify-center
             aspect-video bg-neutral-900 rounded-xl
             border border-neutral-800 animate-pulse"
      >
        <div class="text-neutral-400">
          Loading masterclass layout...
        </div>
      </div>

      <div
          v-else-if="asset && (
        asset.status === 'processing' ||
        asset.status === 'pending'
      )"
          class="flex flex-col items-center justify-center
             aspect-video bg-neutral-950 rounded-xl
             border border-dashed border-neutral-800
             p-8 text-center"
      >
        <div class="relative flex items-center justify-center mb-4">
          <div
              class="absolute w-12 h-12 border-4
                 border-blue-500/20 border-t-blue-500
                 rounded-full animate-spin"
          ></div>
          <div
              class="w-8 h-8 border-4
                 border-purple-500/10 border-t-purple-500
                 rounded-full animate-spin animation-reverse"
          ></div>
        </div>

        <h3 class="text-xl font-semibold mb-1">
          Optimizing Video Stream
        </h3>
        <p class="text-sm text-neutral-400 max-w-md">
          We are compressing your media, updating the audio
          container layout, and adjusting the FastStart markers
          for smooth web playback. This will play automatically.
        </p>
      </div>

      <div
          v-else-if="asset && asset.status === 'failed'"
          class="flex flex-col items-center justify-center
             aspect-video bg-red-950/20 rounded-xl
             border border-red-900/50 p-8 text-center"
      >
        <div class="text-3xl mb-2">⚠️</div>
        <h3 class="text-xl font-semibold mb-1 text-red-200">
          Transcoding Engine Failure
        </h3>
        <p class="text-sm text-red-400 max-w-md">
          FFmpeg processing failed on this video profile.
          Check your server shell logs for structural
          codec or file layout issues.
        </p>
      </div>

      <div v-else-if="asset && asset.status === 'ready'" class="space-y-4">
        <VideoPlayer
            :assetId="asset.id"
            :src="`/api/stream/${asset.id}`"
        />

        <div class="pt-2">
          <h1 class="text-2xl font-bold tracking-tight">
            {{ asset.title }}
          </h1>
          <p class="text-neutral-400 mt-2 text-sm leading-relaxed">
            {{ asset.description || 'No description provided.' }}
          </p>
        </div>
      </div>

      <NuxtLink
          to="/upload"
          class="inline-flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/40 px-4 py-2 rounded-lg font-mono text-xs font-medium tracking-wide transition-all duration-200 active:scale-95 shadow-sm shadow-blue-950/20"
      >
        <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        Upload a new video
      </NuxtLink>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const assetId = route.params.id

const asset = ref(null)
const pending = ref(true)
let pollTimer = null

const fetchAssetMetadata = async () => {
  try {

    // Catch empty or missing path parameters immediately
    if (!assetId) {
      console.warn('No asset ID provided in path.')
      pending.value = false
      return
    }

    // 1. Fetch the initial record from the backend
    const data = await $fetch(`/api/assets/${assetId}`)
    asset.value = data

    // 2. CRITICAL: Turn off the loading screen immediately!
    pending.value = false

    // 3. If the video isn't ready yet, start the background poll
    if (data && data.status !== 'ready') {
      startPolling()
    }
  } catch (err) {
    console.error('Failed to load asset metadata:', err)
    // Turn off loading even on error so an error state can show
    pending.value = false
  }
}

const startPolling = () => {
  pollTimer = setInterval(async () => {
    try {
      const data = await $fetch(`/api/assets/${assetId}`)
      asset.value = data

      // If the backend worker finishes, clear the timer loop
      if (data && data.status === 'ready') {
        clearInterval(pollTimer)
      }
    } catch (err) {
      console.error('Polling tick failed:', err)
    }
  }, 4000)
}

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onMounted(() => {
  fetchAssetMetadata()
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>