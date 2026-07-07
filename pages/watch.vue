<template>
  <div class="min-h-screen bg-[#060b13] text-white p-8">
    <!-- Header/Nav Banner -->
    <div class="max-w-7xl mx-auto mb-8 flex justify-between items-center">
      <h1 class="text-xl font-bold tracking-wider text-blue-400 flex items-center gap-2">
        <span class="bg-blue-500 text-white px-2 py-0.5 rounded text-sm">V</span>
        VeloStream<span class="text-gray-400 text-xs font-mono">.DAM</span>
      </h1>
      <div class="text-xs font-mono bg-[#0f172a] border border-slate-800 px-3 py-1 rounded-full text-slate-400">
        Status: <span class="text-emerald-400 animate-pulse">●</span> Engine Local Stable
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="max-w-7xl mx-auto p-4 bg-red-950/50 border border-red-500/30 rounded-xl text-red-200">
      <p class="font-semibold">Failed to load asset</p>
      <p class="text-sm text-red-400/80">{{ error.message || 'Asset catalog entry missing.' }}</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="pending" class="max-w-7xl mx-auto text-center py-20 text-slate-400 font-mono">
      Loading asset payload matrix...
    </div>

    <!-- Main Content Layout -->
    <div v-else-if="asset" class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

      <!-- Left: Video Player & Title (Takes 2 cols) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Passing the dedicated streaming endpoint as the src -->
        <VideoPlayer
            v-if="asset"
            :assetId="asset.id"
            :src="`/api/stream/${asset.id}`"
        />

        <div class="space-y-2">
          <h2 class="text-2xl font-bold tracking-tight text-slate-100">
            {{ asset?.title }}
          </h2>
          <p class="text-slate-400 text-sm leading-relaxed">
            {{ asset?.description }}
          </p>
        </div>
      </div>

      <!-- Right: Asset Specifications Panel (Takes 1 col) -->
      <div class="bg-[#0b1320] border border-slate-800/60 rounded-xl p-6 h-fit space-y-6">
        <h3 class="text-xs font-bold tracking-widest text-slate-400 uppercase border-b border-slate-800/80 pb-3">
          Asset Specifications
        </h3>

        <div class="space-y-4 font-mono text-xs">
          <div class="flex justify-between items-center py-1">
            <span class="text-slate-500">MIME_TYPE</span>
            <span class="text-blue-400 font-semibold">{{ asset.mimeType || 'video/mp4' }}</span>
          </div>

          <div class="flex justify-between items-center py-1">
            <span class="text-slate-500">PAYLOAD_SIZE</span>
            <span class="text-emerald-400 font-semibold">{{ formatBytes(asset.fileSize) }}</span>
          </div>

          <div class="flex flex-col gap-1.5 py-1">
            <span class="text-slate-500">STORAGE_KEY</span>
            <span class="text-slate-300 break-all bg-[#070c14] p-2 rounded border border-slate-800/40 text-[11px]">
              {{ asset.storageKey }}
            </span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useFetch } from '#app'

const route = useRoute()

// Pull the asset ID from the route query string (e.g., /watch?id=some-uuid)
const assetId = computed(() => route.query.id)

// Fetch metadata reactively from your server/api/assets/[id].ts endpoint
const { data: asset, pending, error } = await useFetch(() => `/api/assets/${assetId.value}`, {
  watch: [assetId],
  immediate: !!assetId.value,
})

// Quick helper to format byte sizes into readable MB/GB readouts matching your UI screenshot
const formatBytes = (bytes) => {
  if (!bytes) return '0.00 MB'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}
</script>