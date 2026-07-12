<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const title = ref('')
const selectedFile = ref(null)
const isUploading = ref(false)

// Capture the file from the inputs
const handleFileChange = (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    selectedFile.value = files[0]
  }
}

// Package data and POST it across the network
const handleUpload = async () => {
  if (!selectedFile.value) return

  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('title', title.value)
    formData.append('video', selectedFile.value)
    formData.append('description', 'Transcoded via VeloStream worker')

    interface UploadResponse {
      success: boolean
      assetId: string
      message: string
    }

    const response = await $fetch<UploadResponse>('/api/assets/upload',
        {
          method: 'POST',
          body: formData,
        }
    )

    if(response.success && response.assetId)
    {
      router.push(`/watch/${response.assetId}`)
    }

  }
  catch (error) {
    console.error('Upload broke down:',error)
    alert('Upload failed.');
  }

}

</script>

<template>
<div class="max-w-5xl mx-auto p-6 space-y-6 text-white"
>
  <h1 class="text-xl font-bold mb-6">
    Upload to VeloStream
  </h1>

  <form @submit.prevent="handleUpload" class="space-y-4">
    <div>
      <label class="block text-xs font-semibold
                 text-neutral-400 uppercase mb-2"
      >
        Video Title
      </label>
      <input
          v-model="title"
          type="text"
          placeholder="My video"
          class="w-full p-2.5 bg-neutral-950
                 rounded-lg border border-neutral-800
                 focus:outline-none focus:border-blue-500
                 text-sm"
          required
      />

    </div>

    <div>
      <label class="block text-xs font-semibold
                 text-neutral-400 uppercase mb-2"
      >
        Select Video File
        </label>
      <input
          type="file"
          accept="video/*"
          @change="handleFileChange"
          class="w-full text-sm text-neutral-400
                 file:mr-4 file:py-2 file:px-4
                 file:rounded-lg file:border-0
                 file:text-sm file:font-semibold
                 file:bg-blue-600 file:text-white
                 hover:file:bg-blue-500 cursor-pointer"
          required
      />
    </div>

    <button
      type="submit"
      :disabled="isUploading"
      class="w-full py-2.5 px-4 bg-blue-600
               hover:bg-blue-500 disabled:bg-neutral-800
               font-semibold rounded-lg text-sm
               transition-colors"
      >
      <span v-if="isUploading">
        Uploading to server...
      </span>
      <span v-else>
        Start Transcode Upload
      </span>
    </button>
  </form>

</div>
</template>

<style scoped>

</style>