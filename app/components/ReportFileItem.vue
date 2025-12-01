<template>
  <UCard>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <UIcon :name="icon" class="w-6 h-6 text-primary-500" />
        <span class="text-lg font-medium">{{ title }}</span>
      </div>

      <div class="flex gap-2">
        <UButton
          v-if="canOpen"
          icon="i-heroicons-arrow-top-right-on-square"
          label="Open"
          @click="openFile"
          variant="soft"
        />

        <UButton
          v-if="canDownload"
          icon="i-heroicons-arrow-down-tray"
          label="Download"
          @click="downloadFile"
          color="primary"
        />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, required: true },
  dataUrl: { type: String, required: true }, // The URL (blob://) generated from Base64
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  canDownload: { type: Boolean, default: true },
  canOpen: { type: Boolean, default: false },
})

// --- Download Logic ---
const downloadFile = () => {
  const link = document.createElement('a')
  link.href = props.dataUrl
  link.download = props.fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// --- Open Logic (New Tab) ---
const openFile = () => {
  // Open the Blob URL directly in a new browser tab
  window.open(props.dataUrl, '_blank')
}
</script>
