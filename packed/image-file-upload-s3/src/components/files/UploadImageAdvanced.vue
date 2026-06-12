<!-- UploadImageAdvanced.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const props = defineProps({
  label: { type: String, default: 'Upload or Take Photo' },
  width: { type: Number, default: 200 },
  height: { type: Number, default: 200 },
  editable: { type: Boolean, default: true },
  returnType: { type: String, default: 'blob' }, // 'blob' | 'base64'
  identity: { type: String },
  uuId: { type: String },
  existingImage: { type: String, default: '' },
  src: { type: String, default: '' },
  labelPosition: { type: String, default: 'bottom' },
  // additionl properties
  compressRatio: { type: Number, default: 1 },   // 0.1 ~ 1 (e.g., 0.5 halves width/height)
  jpegQuality:  { type: Number, default: 0.9 },  // 0.1 ~ 1 (JPEG encode quality)
  outputFormat: { type: String, default: 'image/jpeg' }, // 'image/jpeg' | 'image/png' | 'image/webp'
  maxWidth:     { type: Number, default: 0 },    // optional hard cap; 0 = ignore
  maxHeight:    { type: Number, default: 0 },    // optional hard cap; 0 = ignore
})

console.log("UploadImageAdvanced.vue----props===", props)

/* ✅ add 'deleted' to emits */
const emit = defineEmits(['cropped', 'deleted'])

/* ---- State ---- */
const file = ref(null)
const fileCamera = ref(null)
const fileGallery = ref(null)

const image = ref(props.src || props.existingImage)
const visible = ref(!image.value)
const rotation = ref(0)
const scale = ref(1)
const croppedImage = ref(null)
const imageUploaded = ref(!!image.value)
const showDialog = ref(false)
const cropper = ref(null)

/* ✅ confirmation dialog state */
const showDeleteConfirm = ref(false)

/* ✅ remember the last confirmed (committed) image */
const committedSrc = ref(image.value || null)

const isClient = typeof window !== 'undefined'
const ua = isClient ? navigator.userAgent || '' : ''

// Heuristic: mobile if coarse pointer OR UA matches common mobile strings
const isPointerCoarse = isClient && window.matchMedia && window.matchMedia('(pointer: coarse)').matches
const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(ua)

// Optional: ensure camera API exists too
const hasMediaDevices = isClient && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

// Show camera button only when it’s plausibly a phone/tablet AND camera API is present
const showCameraButton = computed(() => (isPointerCoarse || isMobileUA) && hasMediaDevices)

// Always allow gallery/file picker
const showGalleryButton = computed(() => true)

const makeProcessedCanvas = (srcCanvas) => {
  let targetW = srcCanvas.width
  let targetH = srcCanvas.height

  // Apply compressRatio (scale down)
  if (props.compressRatio > 0 && props.compressRatio < 1) {
    targetW = Math.max(1, Math.round(targetW * props.compressRatio))
    targetH = Math.max(1, Math.round(targetH * props.compressRatio))
  }

  console.log("targetW, targetH ==", targetW, targetH)

  // Apply max caps (if provided)
  if (props.maxWidth && targetW > props.maxWidth) {
    const r = props.maxWidth / targetW
    targetW = Math.round(targetW * r)
    targetH = Math.round(targetH * r)
  }
  if (props.maxHeight && targetH > props.maxHeight) {
    const r = props.maxHeight / targetH
    targetW = Math.round(targetW * r)
    targetH = Math.round(targetH * r)
  }

  // If no change, just return original
  if (targetW === srcCanvas.width && targetH === srcCanvas.height) return srcCanvas

  // Draw to a resized canvas
  const out = document.createElement('canvas')
  out.width = targetW
  out.height = targetH
  const ctx = out.getContext('2d')

  // Better downscale quality (multi-step or imageSmoothing settings)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(srcCanvas, 0, 0, targetW, targetH)
  return out
}

/* ====== HEIC/HEIF support ====== */

/** Detect HEIC/HEIF by mime or extension */
const isHeicLike = (file) => {
  const t = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  if (t.includes('heic') || t.includes('heif')) return true
  return name.endsWith('.heic') || name.endsWith('.heif')
}

/** Convert HEIC to JPEG using heic2any if available; fallback to canvas */
const heicToJpeg = async (file) => {
  try {
    // Lazy load heic2any (install: npm i heic2any)
    const mod = await import(/* @vite-ignore */ 'heic2any')
    const heic2any = mod.default || mod
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: props.jpegQuality || 0.9 })

    // heic2any may return a Blob or an array of Blobs
    const blob = Array.isArray(out) ? out[0] : out
    return new File([blob], replaceExt(file.name, '.jpg'), { type: 'image/jpeg' })
  } catch (e) {
    console.warn('heic2any failed or not installed, trying canvas fallback:', e)
    // Fallback: use createImageBitmap + canvas -> JPEG (supported in modern browsers)
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
      const canvas = document.createElement('canvas')
      canvas.width = bmp.width
      canvas.height = bmp.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(bmp, 0, 0)
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.95))
      return new File([blob], replaceExt(file.name, '.jpg'), { type: 'image/jpeg' })
    } catch (e2) {
      console.error('Canvas fallback failed:', e2)
      throw new Error('この端末ではHEIC画像の変換に対応していません。ギャラリーの「互換性の高い」形式をご利用ください。')
    }
  }
}

const replaceExt = (name, newExt) => {
  if (!name) return `image${newExt}`
  const i = name.lastIndexOf('.')
  return (i > -1 ? name.slice(0, i) : name) + newExt
}

/** Read a File (possibly HEIC) → DataURL (JPEG if converted) */
const loadImageFileAsDataUrl = async (file) => {
  let f = file
  if (isHeicLike(file)) {
    f = await heicToJpeg(file)
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(f)
  })
}

/* ---- Methods ---- */
const getCropped = () => {
  if (!cropper.value || !image.value) return null
  const { canvas } = cropper.value.getResult()
  if (!canvas) return null

  const processed = makeProcessedCanvas(canvas)
  const mime = props.outputFormat || 'image/jpeg'
  const quality = Math.min(1, Math.max(0.1, props.jpegQuality || 0.9))

  console.log("quality==", quality)

  if (props.returnType === 'base64') {
    const dataUrl = processed.toDataURL(mime, quality)
    croppedImage.value = dataUrl
    committedSrc.value = dataUrl
    emit('cropped', { base64: dataUrl, identity: props.identity, mime, quality })
    visible.value = false
    imageUploaded.value = true
    return dataUrl
  } else {
    processed.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      croppedImage.value = url
      committedSrc.value = url
      emit('cropped', { blob, identity: props.identity, mime, quality })
      visible.value = false
      imageUploaded.value = true
    }, mime, quality)
    return null
  }
}

/* ====== NEW unified file handler ====== */
const handlePickedFile = async (rawFile) => {
  if (!rawFile) return
  try {
    const dataUrl = await loadImageFileAsDataUrl(rawFile)
    image.value = dataUrl
    visible.value = true
    imageUploaded.value = true
    croppedImage.value = null
    rotation.value = 0
    scale.value = 1
  } catch (err) {
    console.error('画像読み込み失敗:', err)
    alert(err.message || '画像の読み込みに失敗しました')
  }
}

/* Existing file change (gallery). Keep it, route to unified handler */
const onFileChange = (event) => {
  const files = event?.target?.files
  if (!files?.length) return
  handlePickedFile(files[0])
}

/* ✅ camera input change → use unified handler */
const onCameraChange = (event) => {
  const files = event?.target?.files
  if (!files?.length) return
  handlePickedFile(files[0])
}

/* Buttons to trigger the hidden inputs */
const openCamera = () => fileCamera.value?.click()
const openGallery = () => fileGallery.value?.click()

/* ✅ Cancel just the current editing/selection and revert to committed image */
const cancelUpload = () => {
  image.value = committedSrc.value
  croppedImage.value = null
  visible.value = false
  imageUploaded.value = !!committedSrc.value
  if (file.value) file.value.value = ''
  if (fileCamera.value) fileCamera.value.value = ''
  if (fileGallery.value) fileGallery.value.value = ''
  rotation.value = 0
  scale.value = 1
}


/* Reset (keep committedSrc as-is; this is your original reset) */
const resetCropper = () => {
  image.value = null
  croppedImage.value = null
  visible.value = false
  imageUploaded.value = false
  if (file.value) file.value.value = ''
  if (fileCamera.value) fileCamera.value.value = ''
  if (fileGallery.value) fileGallery.value.value = ''
  rotation.value = 0
  scale.value = 1
}

/* ✅ Full delete: clear everything & notify parent */
const deleteImage = (silent = false) => {
  image.value = null
  croppedImage.value = null
  committedSrc.value = null
  visible.value = false
  imageUploaded.value = false
  if (file.value) file.value.value = ''
  if (fileCamera.value) fileCamera.value.value = ''
  if (fileGallery.value) fileGallery.value.value = ''
  rotation.value = 0
  scale.value = 1
  if (!silent) emit('deleted', { uuid: props.uuId })
}

const rotateImage = () => {
  cropper.value?.rotate(90)
}

const openDialog = () => {
  const src = croppedImage.value || image.value || props.existingImage
  if (src) showDialog.value = true
}
const closeDialog = () => { showDialog.value = false }

/* ✅ trigger confirm popup */
const requestDelete = () => { showDeleteConfirm.value = true }
/* ✅ confirm/cancel handlers */
const confirmDelete = () => {
  showDeleteConfirm.value = false
  deleteImage(false)
}
const cancelDelete = () => { showDeleteConfirm.value = false }

watch(() => props.src, (newSrc) => {
  if (newSrc) {
    image.value = newSrc
    committedSrc.value = newSrc
    imageUploaded.value = true
    // クロップ中の画面を開いていなければ、表示フラグを調整
    if (!croppedImage.value) {
      visible.value = false 
    }
  }
}, { immediate: true })

/* expose for parent if needed */
defineExpose({ getCropped, resetCropper, deleteImage, cancelUpload, croppedImage, src: image })
</script>


<template>

 <div class="upload-image-container">
    <!-- Read-only mode -->
    <div v-if="!editable && (image || existingImage)" class="image-preview">
      <label v-if="label && labelPosition === 'top'" class="upload-label">{{ label }}</label>
      <img
        :src=image
        class="mt-4 image-zoom"
        :style="{ width: `${width}px`, border: '1px dashed #ccc' }"
        @click="openDialog"
        alt="preview"
      />
      <label v-if="label && labelPosition === 'bottom'" class="upload-label">{{ label }}</label>
    </div>

    <!-- Upload Input -->
    <div v-if="editable && !imageUploaded" class="file-input">
      <label v-if="label && labelPosition === 'top'" class="upload-label" :for="`file-${identity}`">{{ label }}</label>

      <!-- Visible action buttons -->
      <div class="controls">
        <!-- <button type="button" class="btn btn-primary" @click="openCamera">📷 カメラで撮影</button>
        <button type="button" class="btn" @click="openGallery">🖼 ギャラリーから</button> -->

        <!-- Visible action buttons -->
        <div class="controls">
          <button
            v-if="showCameraButton"
            type="button"
            class="btn btn-primary"
            @click="openCamera"
          >
            📷 カメラで撮影
          </button>

          <button
            v-if="showGalleryButton"
            type="button"
            class="btn"
            @click="openGallery"
          >
            🖼 ギャラリーから
          </button>
        </div>

        <!-- Hidden inputs -->
        <input
          v-if="showCameraButton"
          ref="fileCamera"
          type="file"
          accept="image/*"
          :capture="showCameraButton ? 'environment' : null"
          class="visually-hidden"
          @change="onCameraChange"
        />

        <input
          ref="fileGallery"
          type="file"
          accept="image/*"
          class="visually-hidden"
          @change="onFileChange"
        />

      </div>

      <!-- Hidden inputs -->
      <!-- Camera: some browsers require capture + accept -->
      <input
        ref="fileCamera"
        type="file"
        accept="image/*"
        capture="environment"
        class="visually-hidden"
        @change="onCameraChange"
      />
      <!-- Gallery: no capture -->
      <input
        ref="fileGallery"
        type="file"
        accept="image/*"
        class="visually-hidden"
        @change="onFileChange"
      />

      <label v-if="label && labelPosition === 'bottom'" class="upload-label" :for="`file-${identity}`">{{ label }}</label>
    </div>

    <!-- Cropper -->
    <div v-if="editable && visible && image" class="cropper-wrapper">
      <div v-if="labelPosition === 'top'" class="cropper-label">{{ label }}</div>

      <Cropper
        ref="cropper"
        :src="image"
        class="cropper"
      />

      <div v-if="labelPosition === 'bottom'" class="cropper-label">{{ label }}</div>

      <div class="controls mt-2">
        <button type="button" class="btn btn-secondary" @click="rotateImage">🔄 回転</button>
        <button type="button" class="btn btn-primary crop-btn" @click="getCropped">切取る</button>
        <!-- ✅ キャンセル -->
        <button type="button" class="btn btn-warning" @click="cancelUpload">キャンセル</button>
      </div>
    </div>

    <!-- Preview after crop -->
    <div v-if="editable && !visible && (croppedImage || image || existingImage)" class="image-preview">
      <div v-if="labelPosition === 'top'" class="preview-label">{{ label }}</div>
      <img
        :src="croppedImage || image || existingImage"
        class="mt-4 image-zoom"
        :style="{ maxWidth: `${width}px` }"
        @click="openDialog"
        alt="cropped"
      />
      <div v-if="labelPosition === 'bottom'" class="preview-label">{{ label }}</div>
      <div class="controls mt-2">
        <button class="btn btn-danger" type="button" @click="resetCropper">✖ リセット</button>
        <!-- ✅ 削除 -->
        <button class="btn btn-secondary" type="button" @click="requestDelete">🗑 削除</button>
      </div>
    </div>

    <!-- Dialog -->
    <div v-if="showDialog" class="overlay" @click.self="closeDialog">
      <div class="overlay-content">
        <img
          :src="croppedImage || image || existingImage"
          style="max-height: 70vh; max-width: 90vw; object-fit: contain"
          alt="dialog"
        />
        <div class="dialog-actions">
          <button class="btn btn-primary" @click="closeDialog">閉じる</button>
        </div>
      </div>
    </div>
    <!-- ✅ Delete Confirm Dialog -->
    <div v-if="showDeleteConfirm" class="overlay" @click.self="cancelDelete" aria-modal="true" role="dialog">
      <div class="overlay-content">
        <div class="confirm-title">画像を削除しますか？</div>
        <div class="confirm-text">この操作は元に戻せません。</div>
        <div class="dialog-actions">
          <button class="btn btn-danger" @click="confirmDelete">はい、削除</button>
          <button class="btn btn-secondary" @click="cancelDelete">いいえ、やめる</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Same as before */
.upload-image-container { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 10px; }
.upload-label, .preview-label, .cropper-label { font-size: 0.95rem; margin-bottom: 6px; display: block; color: #333; font-weight: 500; }
.file-input, .image-preview, .cropper-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; width: 100%; }
.file-input input[type="file"] { padding: 8px; border: 1px dashed #ccc; border-radius: 6px; background: #fafafa; width: 100%; max-width: 300px; }
.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }
.btn { padding: 6px 12px; border: 1px solid #ccc; background: #f7f7f7; border-radius: 6px; cursor: pointer; font-size: 0.9rem; min-width: 36px; text-align: center; }
.btn:hover { opacity: 0.9; transform: translateY(-1px); }
.btn-primary { background: #3182ce; border-color: #2b6cb0; color: white; }
.btn-secondary { background: #e2e8f0; border-color: #718096; color: #2d3748; }
.btn-danger { background: #e53e3e; border-color: #c53030; color: white; font-weight: bold; }
.controls { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.cropper { width: 100%; max-width: 300px; height: 200px; background: #f4f4f4; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.image-zoom { transition: transform 0.3s ease; width: 100%; max-width: 200px; height: auto; border: 1px dashed #ccc; border-radius: 6px; }
.image-zoom:hover { transform: scale(1.8); filter: brightness(1.1); cursor: zoom-in; }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: grid; place-items: center; z-index: 9999; }
.overlay-content { background: #111; padding: 16px; border-radius: 12px; text-align: center; }
.dialog-actions { margin-top: 12px; }
.btn-warning { background: #f6ad55; border-color: #dd6b20; color: #1a202c; }
.confirm-title { font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 8px; }
.confirm-text { font-size: 0.9rem; color: #ddd; margin-bottom: 12px; }
.visually-hidden {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
</style>