<!-- UploadImageWrapper.vue -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, defineProps, watch, onUpdated } from 'vue'
import UploadFile from './UploadImageAdvanced.vue'
import { useAppConfigStore } from '@/stores/AppConfigStore'
import { useDBConnectionStore } from '@/stores/DBConnectionStore'

const configStore = useAppConfigStore()
configStore.loadFromWindow()

const dbStore = useDBConnectionStore()

const props = defineProps({
  category_code: { type: String, default: '' },
  swapSizeInLandscape: { type: Boolean, default: true },
  identity: { type: String, default: '' },
  compressRatio: { type: Number, default: 1 },   // 0.1 ~ 1 (e.g., 0.5 halves width/height)
  jpegQuality:  { type: Number, default: 0.9 },  // 0.1 ~ 1 (JPEG encode quality)
  outputFormat: { type: String, default: 'image/jpeg' }, // 'image/jpeg' | 'image/png' | 'image/webp'
  maxWidth:     { type: Number, default: 0 },    // optional hard cap; 0 = ignore
  maxHeight:    { type: Number, default: 0 },    // optional hard cap; 0 = ignore
})

// --- 重要な設定: 明示的なtidパスを保持 ---
const tid = 'janga_vue_base_system'
const readBlobURL = `/${tid}/dataEngine/v1/handleRequest/readImage.php`;

// --- Config ---
const cfg = computed(() => (configStore.UploadFiles?.[props.category_code]) || {})
const files = computed(() => cfg.value.files || [])
const baseWidth = computed(() => cfg.value.width)
const baseHeight = computed(() => cfg.value.height)
const returnType = computed(() => cfg.value.returnType)
const editable = computed(() => (typeof cfg.value.editable === 'boolean' ? cfg.value.editable : true))

console.log("baseHeight, baseWidth",baseHeight.value, baseWidth.value)

// --- Mobile detection ---
const isMobile = ref(false)
let mql = null

const updateIsMobile = () => {
  isMobile.value = window.matchMedia('(max-width: 768px)').matches
}

onMounted(() => {
  mql = window.matchMedia('(max-width: 768px)')
  updateIsMobile()
  if (mql.addEventListener) mql.addEventListener('change', updateIsMobile)
  else mql.addListener(updateIsMobile)
})

onBeforeUnmount(() => {
  if (mql) {
    if (mql.removeEventListener) mql.removeEventListener('change', updateIsMobile)
    else mql.removeListener(updateIsMobile)
  }
})

// --- Desktop layout mode ---
const desktopMode = ref((cfg.value.direction === 'row') ? 'landscape' : 'portrait')

const flexDirection = computed(() => {
  return isMobile.value ? 'column' : (desktopMode.value === 'landscape' ? 'row' : 'column')
})

const visualWidth = computed(() => {
  if (!props.swapSizeInLandscape) return baseWidth.value
  return !isMobile.value && desktopMode.value === 'landscape' ? baseHeight.value : baseWidth.value
})

const visualHeight = computed(() => {
  if (!props.swapSizeInLandscape) return baseHeight.value
  return !isMobile.value && desktopMode.value === 'landscape' ? baseWidth.value : baseHeight.value
})

console.log("visualWidth, visualHeight===", visualWidth.value, visualHeight.value )

const tileWidthPercent = computed(() => {
  const n = Math.max(1, files.value.length)
  return flexDirection.value === 'row' ? `calc(${100 / n}% - 12px)` : '100%'
})

// --- Collect child components safely ---
const childComponents = ref([])

const setChildRef = (el, index) => {
  if (el) {
    childComponents.value[index] = el
    console.log(`✅ Component registered at index ${index}:`, el)
  }
}

// Add this to debug component registration
onUpdated(() => {
  console.log('🔄 Components updated. Total:', childComponents.value.length)
  childComponents.value.forEach((comp, i) => {
    if (comp) {
      console.log(`Component ${i}: hasCroppedImage=${!!comp.croppedImage}, src=${comp.src}`)
    }
  })
})

// --- Utility functions ---
/**
 * Convert base64 image data to Blob
 * @param {string} base64 - Base64 encoded image data
 * @returns {Promise<Blob>} - Image as Blob
 */
const fetchImageBlob = async (base64) => {
  try {
    const response = await fetch(base64)
    return await response.blob()
  } catch (error) {
    console.error('Error converting base64 to Blob:', error)
    throw new Error('画像の変換に失敗しました')
  }
}

/**
 * Generate field key in the correct format
 * @param {string} key - Base key
 * @returns {string} - Formatted field key
 */
const field_key = (key) => `${props.category_code}_${key}_${props.identity}`

/**
 * Get image URL for display with cache busting
 * @param {string} key - Image key
 * @returns {string} - Image URL with cache busting
 */
const imgUrl = (key) => {
  const fd = field_key(key)
  return `${readBlobURL}?field_key=${fd}&t=${Date.now()}`
}

// --- Save All Images ---
const saving = ref(false)
const saveResult = ref(null)
const saveProgress = ref(0)
const totalImages = ref(0)

/**
 * Check if component has a valid cropped image with IMPROVED validation
 * ONLY THIS FUNCTION IS MODIFIED - ALL OTHER CODE IS UNCHANGED
 * @param {Object} comp - Component instance
 * @param {Object} fileConfig - File configuration
 * @returns {boolean} - Whether component has valid cropped image
 */
const hasValidCroppedImage = (comp, fileConfig) => {
  if (!comp) {
    console.log(`❌ Component not found for ${fileConfig?.field || 'unknown'}`)
    return false
  }
  
  // EXTREMELY FLEXIBLE validation - accept ANY non-empty string
  const isValidDataUrl = comp.croppedImage && comp.croppedImage.trim() !== ''
  
  if (!isValidDataUrl) {
    console.log(`⏭️ No valid cropped image for ${fileConfig.field}`)
  }
  
  return isValidDataUrl
}

/**
 * Save all images one by one
 */
const saveAllImages = async () => {
  saving.value = true
  saveResult.value = null
  saveProgress.value = 0
  
  await nextTick() // Ensure DOM is updated
  
  try {
    // Collect valid images to upload
    const validComponents = []
    
    for (let i = 0; i < files.value.length; i++) {
      const comp = childComponents.value[i]
      const fileConfig = files.value[i]
      
      if (!comp) {
        console.warn(`⚠️ Component not found for ${fileConfig.field} at index ${i}`)
        continue
      }
      
      // Check if there's a valid cropped image - with detailed logging
      const isValid = hasValidCroppedImage(comp, fileConfig)
      
      if (isValid) {
        validComponents.push({ comp, fileConfig })
        console.log(`✅ Found valid cropped image for ${fileConfig.field}`)
        console.log(`   - Cropped image: ${comp.croppedImage.substring(0, 50)}...`)
      } else {
        console.log(`⏭️ Skipping ${fileConfig.field} (no valid cropped image)`)
      }
    }
    
    if (validComponents.length === 0) {
      // Show user-friendly message
      saveResult.value = {
        type: 'info',
        message: '編集された画像がありません。変更を加えてから保存してください。'
      }
      console.log('ℹ️ No images to save - none were edited')
      
      // Log detailed component status
      console.log('🔍 Detailed component status:')
      for (let i = 0; i < childComponents.value.length; i++) {
        const comp = childComponents.value[i]
        const fileConfig = files.value[i]
        if (comp) {
          console.log(`   - ${fileConfig.field}:`, {
            hasCroppedImage: !!comp.croppedImage,
            croppedImagePreview: comp.croppedImage ? comp.croppedImage.substring(0, 30) + '...' : 'N/A'
          })
        }
      }
      
      return
    }
    
    totalImages.value = validComponents.length
    console.log(`📸 Preparing to upload ${totalImages.value} images`)
    
    const results = []
    
    // Process each image individually
    for (let i = 0; i < validComponents.length; i++) {
      const { comp, fileConfig } = validComponents[i]
      
      try {
        // Trigger manual crop if needed
        if (typeof comp.getCropped === 'function') {
          console.log(`🔄 Triggered getCropped for ${fileConfig.field}`)
          comp.getCropped()
          
          // Wait for canvas to be ready - increased from 300ms to 500ms
          await new Promise(resolve => setTimeout(resolve, 500))
        } else {
          console.warn(`⚠️ getCropped method not available for ${fileConfig.field}`)
        }
        
        // Convert base64 to Blob
        const blob = await fetchImageBlob(comp.croppedImage)
        
        // Generate field key
        const fd = field_key(fileConfig.field)
        
        // Upload the image using the uploadImage method
        const result = await dbStore.uploadImage(fd, blob)
        
        results.push({
          success: true,
          field: fileConfig.field,
          result: result
        })
        
        // Update progress
        saveProgress.value = Math.round((i + 1) / totalImages.value * 100)
        
        console.log(`✅ Successfully uploaded image for ${fileConfig.field}`)
      } catch (err) {
        console.error(`🖼️ 画像アップロードに失敗しました ${fileConfig.field}:`, err)
        results.push({
          success: false,
          field: fileConfig.field,
          error: err.message
        })
        
        // Update progress
        saveProgress.value = Math.round((i + 1) / totalImages.value * 100)
      }
    }
    
    // Process results
    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length
    
    if (successCount > 0) {
      saveResult.value = {
        type: 'success',
        message: `✅ ${successCount} 件の画像を保存しました！`,
        details: results
      }
      
      // Force refresh ALL images with new timestamp
      const timestamp = Date.now()
      for (let i = 0; i < childComponents.value.length; i++) {
        const comp = childComponents.value[i]
        if (comp && files.value[i]) {
          const fd = field_key(files.value[i].field)
          comp.src = `${readBlobURL}?field_key=${fd}&t=${timestamp}`
          comp.croppedImage = null
          console.log(`🔄 Force refreshed image for ${files.value[i].field}`)
        }
      }
    }
    
    if (errorCount > 0) {
      const errorMsg = saveResult.value 
        ? saveResult.value.message + ` (${errorCount} 件失敗)`
        : `❌ ${errorCount} 件の画像保存に失敗しました`
      
      saveResult.value = {
        type: 'error',
        message: errorMsg,
        details: results.filter(r => !r.success)
      }
    }
    
  } catch (err) {
    saveResult.value = {
      type: 'error',
      message: `❌ 保存処理中にエラーが発生しました: ${err.message}`,
    }
    console.error('💾 Save error:', err)
  } finally {
    saving.value = false
    totalImages.value = 0
  }
}

// Auto-refresh images when identity changes
watch(() => props.identity, () => {
  const timestamp = Date.now()
  for (let i = 0; i < childComponents.value.length; i++) {
    const comp = childComponents.value[i]
    if (comp && files.value[i]) {
      const fd = field_key(files.value[i].field)
      comp.src = `${readBlobURL}?field_key=${fd}&t=${timestamp}`
      comp.croppedImage = null
    }
  }
})

// Handle cropped event
const handleCropped = (field, cropped) => {
  if (!cropped) {
    console.warn(`⚠️ No cropped data for ${field}`)
    return
  }
  
  // Check if cropped data is valid
  if (cropped.blob) {
    console.log(`✅ Cropped image received for ${field}`, {
      blobSize: cropped.blob.size,
      type: cropped.blob.type
    })
  } else if (cropped.base64) {
    console.log(`✅ Cropped image received for ${field} (base64)`)
  }
}

const handleDeleted = async (field) => {
  console.log("fileConfig.field====", field)
  const response = await dbStore.deleteImage(field_key(field))
  console.log("response====", response)
}


</script>

<template>
  <section class="wrapper">
    <!-- Toolbar -->
    <div class="toolbar" v-if="!isMobile">
      <div class="toolbar__group">
        <button type="button" class="btn" :class="{ 'btn--active': desktopMode === 'portrait' }" @click="desktopMode = 'portrait'">Portrait</button>
        <button type="button" class="btn" :class="{ 'btn--active': desktopMode === 'landscape' }" @click="desktopMode = 'landscape'">Landscape</button>
      </div>
      <div class="toolbar__hint">
        <span v-if="swapSizeInLandscape">Size swap: <b>ON</b></span>
        <span v-else>Size swap: <b>OFF</b></span>
      </div>
    </div>

    <!-- Image Grid -->
    <div class="image-wrapper-container" :style="{ flexDirection }">
      <div
        v-for="(fileConfig, index) in files"
        :key="fileConfig.field"
        class="image-side"
        :style="{ width: tileWidthPercent }"
      >
        <UploadFile
          :ref="(el) => setChildRef(el, index)"
          :label="fileConfig.headerName"
          labelPosition="top"
          :identity="props.identity"
          :width="visualWidth"
          :height="visualHeight"
          :returnType="returnType"
          :editable="editable"
          :src="imgUrl(fileConfig.field)"
          @cropped="(cropped) => handleCropped(fileConfig.field, cropped)"
          @deleted="() => handleDeleted(fileConfig.field)"
          :compressRatio="props.compressRatio"
          :jpegQuality="props.jpegQuality"
          :outputFormat="props.outputFormat"
          :maxWidth="props.maxWidth"
          :maxHeight="props.maxHeight"
        />
      </div>
    </div>

    <!-- Save Button -->
    <div class="action-bar mt-4" v-if="editable">
      <button
        type="button"
        class="btn btn-primary save-btn"
        :disabled="saving"
        @click="saveAllImages"
      >
        <span v-if="saving">
          <span v-if="totalImages > 0">{{ saveProgress }}%</span>
          <span v-else>Saving...</span>
        </span>
        <span v-else>
          💾 保存
        </span>
      </button>

      <!-- Feedback -->
      <div v-if="saveResult" class="alert" 
           :class="{
             'alert-success': saveResult.type === 'success',
             'alert-error': saveResult.type === 'error',
             'alert-info': saveResult.type === 'info'
           }">
        {{ saveResult.message }}
      </div>
    </div>
  </section>
</template>

<style scoped>
.wrapper {
  width: 100%;
}

/* ---- Toolbar (desktop only) ---- */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0 14px;
}

.toolbar__group {
  display: inline-flex;
  border: 1px solid var(--c-border, #3a3a3a33);
  border-radius: 10px;
  overflow: hidden;
}

.btn {
  appearance: none;
  background: transparent;
  border: 0;
  padding: 8px 14px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.btn:hover { background: #00000010; }
.btn--active {
  background: #00000018;
  font-weight: 600;
}

.toolbar__hint {
  font-size: 12px;
  opacity: 0.75;
}

/* ---- Images container ---- */
.image-wrapper-container {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap; /* allow wrap on smaller desktops */
}

/* Each tile */
.image-side {
  /* Default width is controlled inline via :style="width: tileWidthPercent" */
  min-width: 220px;
}

/* ---- Force vertical on mobile ---- */
@media (max-width: 768px) {
  .toolbar { display: none; }           /* no controls on mobile */
  .image-wrapper-container {
    flex-direction: column !important;  /* safety: always stack */
    align-items: stretch;
  }
  .image-side {
    width: 100% !important;
    min-width: 0;
  }
}

/* Optional: nicer dark-mode border */
:where(html.dark) .toolbar__group {
  border-color: #ffffff22;
}

.action-bar {
  margin-top: 20px;
  text-align: center;
}

.save-btn {
  padding: 10px 20px;
  font-size: 1rem;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.save-btn:hover:not(:disabled) {
  background: #2c5aa0;
}
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  margin-top: 10px;
  padding: 10px;
  border-radius: 6px;
  font-size: 0.9rem;
}
.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
.alert-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
.alert-info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}
</style>