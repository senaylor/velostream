<template>
  <div class="min-h-screen bg-[#060b13] text-white p-8 flex flex-col items-center justify-center">
    <div class="max-w-md text-center space-y-4 font-mono text-slate-400">
      <div v-if="loading" class="space-y-2">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p class="text-xs">Locating latest optimized playback matrix...</p>
      </div>
      <div v-else class="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
        <p class="text-sm text-amber-400 mb-2">⚠️ No Ready Streams Found</p>
        <p class="text-xs text-neutral-400 leading-relaxed">
          The processing ledger is currently empty. Head over to the upload bay to seed a profile into the network.
        </p>
        <NuxtLink
            to="/upload"
            class="inline-block mt-4 text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          Go to Upload Dashboard
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(true)

onMounted(async () => {
  try {
    const latestAsset = await $fetch('/api/assets/latest-ready')

    if (latestAsset && !latestAsset.noAssets && latestAsset.id) {
      // Clean forward to the discovered active stream
      router.replace(`/watch/${latestAsset.id}`)
    } else {
      loading.value = false
    }
  } catch (err) {
    console.error('Failed to resolve landing matrix redirect:', err)
    loading.value = false
  }
})
</script>