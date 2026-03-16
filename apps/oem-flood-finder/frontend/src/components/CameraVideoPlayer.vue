<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Hls from 'hls.js'

const props = defineProps<{
  videoUrl: string
  autoplay?: boolean
}>()

const videoRef = ref<HTMLVideoElement>()
let hls: Hls | null = null

const initializeVideo = () => {
  if (!videoRef.value || !props.videoUrl) return

  // Clean up existing HLS instance
  if (hls) {
    hls.destroy()
    hls = null
  }

  // Check if it's an HLS stream (.m3u8)
  if (props.videoUrl.includes('.m3u8')) {
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      })
      hls.loadSource(props.videoUrl)
      hls.attachMedia(videoRef.value)
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.log('HLS Error:', data)
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error - attempting to recover')
              hls?.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error - attempting to recover')
              hls?.recoverMediaError()
              break
            default:
              console.log('Fatal error - destroying HLS instance')
              hls?.destroy()
              break
          }
        }
      })
    } else if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.value.src = props.videoUrl
    }
  } else {
    // Regular video file
    videoRef.value.src = props.videoUrl
  }
}

const reloadVideo = () => {
  if (hls) {
    hls.stopLoad()
    hls.startLoad()
  } else if (videoRef.value) {
    videoRef.value.load()
  }
}

// Watch for URL changes and reinitialize
watch(() => props.videoUrl, () => {
  if (props.videoUrl) {
    setTimeout(initializeVideo, 100)
  }
})

onMounted(() => {
  if (props.videoUrl) {
    setTimeout(initializeVideo, 100) // Small delay to ensure DOM is ready
  }
})

onUnmounted(() => {
  if (hls) {
    hls.destroy()
    hls = null
  }
})
</script>

<template>
  <div class="camera-video-player">
    <video 
      ref="videoRef"
      :autoplay="autoplay || false" 
      :playsinline="true" 
      :controls="true"
      :muted="true"
      preload="metadata"
    >
      Your browser does not support the video tag.
    </video>
    
    <button @click="reloadVideo" class="reload-video-btn" title="Reload video">
      🔄 Reload Stream
    </button>
  </div>
</template>

<style scoped>
.camera-video-player {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reload-video-btn {
  background-color: #007acc;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  align-self: flex-start;
}

.reload-video-btn:hover {
  background-color: #005999;
}
</style>