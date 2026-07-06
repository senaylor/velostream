<!-- components/VideoPlayer.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  assetId: string
  poster?: string
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

// Computed stream URL pointing directly to our Nitro custom engine
const streamUrl = computed(() => `/api/stream/${props.assetId}`)

const togglePlay = () => {
  if (!videoRef.value) return
  if (videoRef.value.paused) {
    videoRef.value.play()
    isPlaying.value = true
  } else {
    videoRef.value.pause()
    isPlaying.value = false
  }
}

// Senior feature: Tracking playback ticks without choking the main thread
const handleTimeUpdate = () => {
  if (!videoRef.value) return
  currentTime.value = videoRef.value.currentTime

  // Every 5 seconds, we can trigger background analytics reporting
  if (Math.floor(currentTime.value) % 5 === 0) {
    emitPlaybackAnalytics()
  }
}

const handleLoadedMetadata = () => {
  if (!videoRef.value) return
  duration.value = videoRef.value.duration
}

const emitPlaybackAnalytics = async () => {
  // We will build this Nitro analytics beacon next!
  // It records where the user is in the chunk pipeline
}
</script>

<template>
  <div class="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden bg-slate-900 shadow-2xl border border-slate-800">
    <!-- The Core Native Video Element backed by our HTTP 206 Streaming Chunk Route -->
    <video
        ref="videoRef"
        :src="streamUrl"
        :poster="poster"
        class="w-full h-auto object-cover aspect-video"
        preload="metadata"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleLoadedMetadata"
        @click="togglePlay"
    ></video>

    <!-- Custom Control Bar Shell -->
    <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent flex items-center gap-4">
      <button
          @click="togglePlay"
          class="bg-sky-500 hover:bg-sky-400 text-slate-950 p-2.5 rounded-full transition font-bold text-xs"
      >
        {{ isPlaying ? 'PAUSE' : 'PLAY' }}
      </button>

      <div class="flex-1 h-1.5 bg-slate-700 rounded-full relative overflow-hidden">
        <div
            class="h-full bg-sky-400 transition-all duration-100 ease-out"
            :style="{ width: `${(currentTime / (duration || 1)) * 100}%` }"
        ></div>
      </div>

      <div class="text-xs font-mono text-slate-400">
        {{ Math.floor(currentTime) }}s / {{ Math.floor(duration) }}s
      </div>
    </div>
  </div>
</template>