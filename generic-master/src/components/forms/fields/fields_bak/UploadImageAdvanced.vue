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
    
    <div v-if="!editable && (image || existingImage)" class="image-preview">
      <label v-if="label && labelPosition === 'top'" class="upload-label">{{ label }}</label>
      
      <v-img
        :src="image"
        class="mt-3 image-zoom rounded-lg shadow-sm"
        width="100%" :max-width="width"
        @click="openDialog"
        alt="preview"
        style="cursor: zoom-in;"
      >
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center fill-height loading-bg">
            <v-progress-circular color="primary" indeterminate size="24"></v-progress-circular>
          </div>
        </template>
      </v-img>
      
      <label v-if="label && labelPosition === 'bottom'" class="upload-label">{{ label }}</label>
    </div>

    <div v-if="editable && !imageUploaded" class="file-input-wrapper">
      <label v-if="label && labelPosition === 'top'" class="upload-label">{{ label }}</label>

      <div class="controls py-2">
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
          class="btn btn-secondary"
          @click="openGallery"
        >
          🖼 ギャラリーから選択
        </button>
      </div>

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

      <label v-if="label && labelPosition === 'bottom'" class="upload-label">{{ label }}</label>
    </div>

    <div v-if="editable && visible && image" class="cropper-wrapper">
      <div v-if="labelPosition === 'top'" class="cropper-label">{{ label }}</div>

      <Cropper
        ref="cropper"
        :src="image"
        class="cropper rounded-lg"
      />

      <div v-if="labelPosition === 'bottom'" class="cropper-label">{{ label }}</div>

      <div class="controls mt-3">
        <button type="button" class="btn btn-secondary" @click="rotateImage">🔄 回転</button>
        <button type="button" class="btn btn-primary crop-btn" @click="getCropped">✂️ 切り取る</button>
        <button type="button" class="btn btn-warning" @click="cancelUpload">キャンセル</button>
      </div>
    </div>

    <div v-if="editable && !visible && (croppedImage || image || existingImage)" class="image-preview">
      <div v-if="labelPosition === 'top'" class="preview-label">{{ label }}</div>
      
      <v-img
        width="200"
        aspect-ratio="4/3"
        :src="croppedImage || image || existingImage"
        class="mt-3 image-zoom rounded-lg shadow-sm"
        :max-width="width"
        @click="openDialog"
        alt="cropped"
        style="cursor: zoom-in;"
      >
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center fill-height loading-bg">
            <v-progress-circular color="primary" indeterminate size="24"></v-progress-circular>
          </div>
        </template>
      </v-img>

      <div v-if="labelPosition === 'bottom'" class="preview-label">{{ label }}</div>
      
      <div class="controls mt-3">
        <button class="btn btn-danger" type="button" @click="resetCropper">✖ リセット</button>
        <button class="btn btn-outline-danger" type="button" @click="requestDelete">🗑 削除</button>
      </div>
    </div>

    <div v-if="showDialog" class="overlay" @click.self="closeDialog">
      <div class="overlay-content rounded-xl shadow-lg">
        <img
          :src="croppedImage || image || existingImage"
          class="dialog-img rounded-lg"
          alt="dialog"
        />
        <div class="dialog-actions">
          <button class="btn btn-light" @click="closeDialog">閉じる</button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteConfirm" class="overlay" @click.self="cancelDelete" aria-modal="true" role="dialog">
      <div class="overlay-content confirm-modal rounded-xl shadow-lg">
        <div class="confirm-icon">⚠️</div>
        <div class="confirm-title">画像を削除しますか？</div>
        <div class="confirm-text">この操作は元に戻せません。</div>
        <div class="dialog-actions vertical-actions">
          <button class="btn btn-danger btn-block" @click="confirmDelete">はい、削除する</button>
          <button class="btn btn-light btn-block" @click="cancelDelete">いいえ、やめる</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* 全体のコンテナ設定 */
.upload-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ラベルの装飾 */
.upload-label, .preview-label, .cropper-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4a5568;
  letter-spacing: 0.05em;
}

/* ラッパー類 */
.file-input-wrapper, .image-preview, .cropper-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  width: 100%;
}

/* ユーティリティマージン */
.mt-3 { margin-top: 12px; }
.py-2 { padding-top: 8px; padding-bottom: 8px; }

/* 共通ボタン（モダンフラットデザイン） */
.btn {
  padding: 10px 20px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.btn:hover {
  opacity: 0.95;
  transform: translateY(-1px);
}
.btn:active {
  transform: translateY(0);
}

/* カラーバリエーション */
.btn-primary {
  background: #3182ce;
  color: white;
}
.btn-primary:hover { background: #2b6cb0; box-shadow: 0 4px 12px rgba(49, 130, 206, 0.2); }

.btn-secondary {
  background: #edf2f7;
  color: #2d3748;
}
.btn-secondary:hover { background: #e2e8f0; }

.btn-warning {
  background: #feebc8;
  color: #dd6b20;
}
.btn-warning:hover { background: #fbd38d; }

.btn-danger {
  background: #e53e3e;
  color: white;
}
.btn-danger:hover { background: #c53030; box-shadow: 0 4px 12px rgba(229, 62, 62, 0.2); }

.btn-outline-danger {
  background: transparent;
  border-color: #feb2b2;
  color: #e53e3e;
}
.btn-outline-danger:hover { background: #fff5f5; border-color: #e53e3e; }

.btn-light {
  background: #ffffff;
  color: #4a5568;
  border-color: #e2e8f0;
}
.btn-light:hover { background: #f7fafc; }

.btn-block { width: 100%; }

/* コントロール配置 */
.controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

/* 切り抜き器（Cropper） */
.cropper {
  width: 100%;
  max-width: 320px;
  height: 220px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

/* 画像プレビュー＆ホバーズーム */
.image-zoom {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;
  max-width: 220px;
  height: auto;
  border: 1px solid #e2e8f0;
  background: #ffffff;
}
.image-zoom:hover {
  transform: scale(1.1); /* 1.8倍から1.1倍に調整して、画面外にはみ出すバグを防ぎ、上品なズームへ変更 */
  box-shadow: 0 10px 20px rgba(0,0,0,0.12) !important;
}

/* ローディング時の背景調和 */
.loading-bg {
  background-color: #f7fafc;
}

/* 共通モーダル（オーバーレイ） */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px); /* 背景をボカして中央に視線を集める */
  display: grid;
  place-items: center;
  z-index: 9999;
  padding: 16px;
}

.overlay-content {
  background: #1e1e1e; /* 純粋な黒から、リッチなダークグレーに変更 */
  padding: 24px;
  text-align: center;
  max-width: 90vw;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.dialog-img {
  max-height: 65vh;
  max-width: 100%;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.dialog-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* 削除確認用モーダル固有 */
.confirm-modal {
  background: #ffffff; /* 確認ダイアログは警告が目立つよう白ベースに変更 */
  max-width: 340px;
  width: 100%;
}
.confirm-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}
.confirm-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 6px;
}
.confirm-text {
  font-size: 0.85rem;
  color: #718096;
  margin-bottom: 20px;
}
.vertical-actions {
  flex-direction: column;
  gap: 8px;
}

/* 境界線の角丸・影用補助クラス */
.rounded-lg { border-radius: 12px !important; }
.rounded-xl { border-radius: 16px !important; }
.shadow-sm { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03) !important; }
.shadow-lg { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04) !important; }

/* アクセシビリティ隠しインプット */
.visually-hidden {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
</style>