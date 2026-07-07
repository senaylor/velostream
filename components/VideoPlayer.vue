<template>
  <div class="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group">
    <video
        ref="videoRef"
        :src="src"
        class="w-full h-full object-contain"
        controls
        preload="metadata"
        crossorigin="anonymous"
        @canplay="onVideoReady"
        @error="onVideoError"
    ></video>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  assetId: { type: String, required: true },
  src: { type: String, required: true }
})

const videoRef = ref(null)
const isReady = ref(false)

const onVideoReady = async () => {
  isReady.value = true
  if (!videoRef.value) return

  try {
    // Autoplay might still be blocked by browser policy,
    // but now the user has native controls to click play manually!
    await videoRef.value.play()
  } catch (error) {
    console.warn("Autoplay managed by browser safety deck:", error)
  }
}

const onVideoError = () => {
  if (videoRef.value && videoRef.value.error) {
    console.error("HTML5 Media Engine Error Code:", videoRef.value.error.code)
    console.error("HTML5 Media Message:", videoRef.value.error.message)
  }
}

watch(() => props.src, () => {
  isReady.value = false
})
</script>