<template>
  <div ref="playerContainerRef" class="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group">
    <video
        ref="videoRef"
        :src="src"
        class="w-full h-full object-contain cursor-pointer"
        preload="metadata"
        crossorigin="anonymous"
        @click="togglePlay"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onMetadataLoaded"
        @error="onVideoError"
    ></video>

    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-3">

      <div class="relative w-full h-1.5 bg-white/30 rounded-full cursor-pointer group/slider" @click="seek">
        <div
            class="absolute top-0 left-0 h-full bg-blue-500 rounded-full group-hover/slider:bg-blue-400"
            :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>

      <div class="flex items-center justify-between text-white">
        <div class="flex items-center gap-4">
          <button @click="togglePlay" class="hover:text-blue-400 transition-colors focus:outline-none">
            <span v-if="isPlaying">⏸ Pause</span>
            <span v-else>▶ Play</span>
          </button>

          <div class="text-xs font-mono select-none">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
          </div>
        </div>

        <div class="flex items-center gap-2 group/volume">
          <button @click="toggleMute" class="hover:text-blue-400 transition-colors focus:outline-none">
            <span v-if="isMuted || volume === 0">🔇</span>
            <span v-else-if="volume < 0.5">🔉</span>
            <span v-else>🔊</span>
          </button>

          <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              v-model.number="volume"
              @input="onVolumeChange"
              class="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-500 opacity-0 group-hover/volume:opacity-100 transition-opacity duration-200"
          />

          <button @click="toggleFullscreen" class="hover:text-blue-400 transition-colors focus:outline-none">
            ⛶ Fullscreen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  assetId: { type: String, required: true },
  src: { type: String, required: true }
})

// Elements & State Matrices
const videoRef = ref(null)
const playerContainerRef = ref(null)

const isPlaying = ref(false)
const volume = ref(1)
const isMuted = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const preMuteVolume = ref(1)

// Calculate timeline completion ratio dynamically
const progressPercent = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

// Playback Trigger Mechanism
const togglePlay = () => {
  if (!videoRef.value) return

  if (isPlaying.value) {
    videoRef.value.pause()
    isPlaying.value = false
  } else {
    videoRef.value.play().catch((e) => console.warn("Blocked:", e))
    isPlaying.value = true
  }
}

const onVolumeChange = () => {
  if (!videoRef.value) return

  videoRef.value.volume = volume.value

  if (volume.value > 0) {
    isMuted.value = false
    videoRef.value.muted = false
  } else {
    isMuted.value = true
  }
}

// Volume Matrix Multiplier
const toggleMute = () => {
  if (!videoRef.value) return

  isMuted.value = !isMuted.value
  videoRef.value.muted = isMuted.value

  if(isMuted.value) {
    preMuteVolume.value = volume.value
    volume.value = 0
  } else {
    volume.value = preMuteVolume.value
    videoRef.value.volume = volume.value
  }

}

// Intercept clicked pixel coordinate math to skip video runtime positions
const seek = (event) => {
  if (!videoRef.value || !duration.value) return

  const rect = event.currentTarget.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const width = rect.width
  const newTime = (clickX / width) * duration.value

  videoRef.value.currentTime = newTime
  currentTime.value = newTime
}

// Keep local state values tracking the hardware clock sync
const onTimeUpdate = () => {
  if (!videoRef.value) return

  currentTime.value = videoRef.value.currentTime
}

const onMetadataLoaded = () => {
  if (!videoRef.value) return

  duration.value = videoRef.value.duration
}

// Standard Native OS Fullscreen API Call
const toggleFullscreen = () => {
  if (!playerContainerRef.value) return

  if (!document.fullscreenElement) {
    playerContainerRef.value.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`)
    })
  } else {
    document.exitFullscreen()
  }
}

// Convert floating point seconds into readable 00:00 strings
const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds)) return '0:00'

  const mins = Math.floor(timeInSeconds / 60)
  const secs = Math.floor(timeInSeconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

const onVideoError = () => {
  if (videoRef.value?.error) {
    console.error("HTML5 Engine Error:", videoRef.value.error.message)
  }
}

// Clean up player state on layout switches
watch(() => props.src, () => {
  isPlaying.value = false
  currentTime.value = 0
})
</script>