<!-- UploadImagePlain.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

const props = defineProps({
  label: { type: String, default: 'Upload or Take Photo' },
  width: { type: Number, default: 200 },
  height: { type: Number, default: 200 },
  editable: { type: Boolean, default: true },
  returnType: { type: String, default: 'blob' }, // 'blob' | 'base64'
  identity: { type: String },
  existingImage: { type: String, default: '' },
  src: { type: String, default: '' },
})

const emit = defineEmits(['cropped'])

const file = ref(null)
const imageData = ref(null)
const cropper = ref(null)

const previewUrl = ref(null)
const croppedImage = ref(null)

const showCropper = ref(true)
const imageUploaded = ref(false)

const showDialog = ref(false)
const dialogEl = ref(null)
const imageSource = ref(props.src || props.existingImage)

const getCropped = () => {
  if (!cropper.value) return
  if (props.returnType === 'base64') {
    cropper.value.getCropData((dataUrl) => {
      croppedImage.value = dataUrl
      previewUrl.value = dataUrl
      showCropper.value = false
      imageUploaded.value = true
      emit('cropped', { base64: dataUrl })
    })
  } else {
    cropper.value.getCropBlob((blob) => {
      const url = URL.createObjectURL(blob)
      croppedImage.value = url
      previewUrl.value = url
      showCropper.value = false
      imageUploaded.value = true
      emit('cropped', { blob })
    })
  }
}

const onFileChange = (event) => {
  const selectedFiles = event?.target?.files || event
  if (!selectedFiles || !selectedFiles.length) return
  const selectedFile = selectedFiles[0]

  const reader = new FileReader()
  reader.onload = (e) => {
    imageData.value = e.target.result
    showCropper.value = true
    croppedImage.value = null
  }
  reader.readAsDataURL(selectedFile)

  imageUploaded.value = true
}

const resetCropper = () => {
  imageData.value = null
  croppedImage.value = null
  previewUrl.value = null
  showCropper.value = true
  imageUploaded.value = false
  if (file.value) file.value.value = '' // clear input
}

const openDialog = () => {
  showDialog.value = true
  // use native <dialog> if supported
  if (dialogEl.value?.showModal) dialogEl.value.showModal()
}

const closeDialog = () => {
  showDialog.value = false
  if (dialogEl.value?.close) dialogEl.value.close()
}

onMounted(() => {
  // If initial src/existingImage provided, mark as uploaded
  if (imageSource.value) {
    imageUploaded.value = true
  }
})

defineExpose({
  getCropped,
  resetCropper,
})
</script>

<template>
  <div class="upload-image-container">
    <!-- Read-only preview when not editable -->
    <div v-if="!editable && (imageSource || existingImage)" class="image-preview">
      <label v-if="label" class="upload-label">{{ label }}</label>
      <img
        :src="imageSource || existingImage"
        class="mt-4 image-zoom"
        :style="{ width: `${width}px`, border: '1px dashed #ccc' }"
        @click="openDialog"
        alt="preview"
      />
    </div>

    <!-- File input (editable) -->
    <div v-if="editable && !imageUploaded && !imageData && !croppedImage" class="file-input">
      <label v-if="label" class="upload-label" :for="`file-${identity || 'uploader'}`">{{ label }}</label>
      <input
        :id="`file-${identity || 'uploader'}`"
        ref="file"
        type="file"
        accept="image/*"
        capture="environment"
        @change="onFileChange"
      />
    </div>

    <!-- Cropper -->
    <div v-if="editable && imageData && showCropper" class="cropper-wrapper">
      <div class="cropper-label">{{ label }}</div>
      <VueCropper
        ref="cropper"
        :img="imageData"
        :autoCrop="true"
        :autoCropWidth="width"
        :autoCropHeight="height"
        style="height: 200px; width: 100%;"
      />
      <button
        v-if="imageData && !croppedImage"
        class="btn btn-primary mt-2"
        type="button"
        @click="getCropped"
      >
        切取る
      </button>
    </div>

    <!-- Cropped / existing preview (editable) -->
    <div v-if="editable && (croppedImage || imageSource || existingImage)" class="image-preview">
      <div class="preview-label">{{ label }}</div>
      <img
        :src="croppedImage || imageSource || existingImage"
        class="mt-4 image-zoom"
        :style="{ maxWidth: '150px' }"
        @click="openDialog"
        alt="cropped"
      />
      <div class="controls">
        <button class="btn btn-secondary mt-2" type="button" @click="resetCropper">リセット</button>
      </div>
    </div>

    <!-- Native dialog (fallback to div if unsupported) -->
    <dialog ref="dialogEl" class="img-dialog" @close="showDialog = false">
      <img
        :src="croppedImage || imageSource || existingImage"
        style="max-height: 70vh; max-width: 90vw; object-fit: contain;"
        alt="dialog"
      />
      <div class="dialog-actions">
        <button class="btn btn-primary" type="button" @click="closeDialog">Close</button>
      </div>
    </dialog>

    <!-- Fallback overlay for environments without <dialog> -->
    <div v-if="showDialog && !('HTMLDialogElement' in window)" class="overlay" @click.self="closeDialog">
      <div class="overlay-content">
        <img
          :src="croppedImage || imageSource || existingImage"
          style="max-height: 70vh; max-width: 90vw; object-fit: contain;"
          alt="overlay"
        />
        <div class="dialog-actions">
          <button class="btn btn-primary" type="button" @click="closeDialog">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.upload-label,
.preview-label,
.cropper-label {
  font-size: 0.95rem;
  margin-bottom: 6px;
  display: inline-block;
}
.image-preview {
  text-align: center;
}
.cropper-wrapper {
  width: 100%;
  text-align: center;
}
.file-input {
  width: 100%;
  max-width: 300px;
}
.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }
.btn {
  padding: 6px 12px;
  border: 1px solid #ccc;
  background: #f7f7f7;
  border-radius: 6px;
  cursor: pointer;
}
.btn-primary {
  border-color: #2b6cb0;
  background: #3182ce;
  color: #fff;
}
.btn-secondary {
  background: #e2e8f0;
}
.image-zoom {
  transition: transform 0.3s ease, filter 0.3s ease;
  width: 100%;
  max-width: 200px;
  height: auto;
  border: 1px dashed #ccc;
}
.image-zoom:hover {
  transform: scale(1.8);
  filter: brightness(1.1);
  cursor: zoom-in;
}
.img-dialog::backdrop {
  background: rgba(0, 0, 0, 0.6);
}
.dialog-actions {
  margin-top: 12px;
  text-align: center;
}
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.6);
  display: grid;
  place-items: center;
  z-index: 9999;
}
.overlay-content {
  background: #111;
  padding: 12px;
  border-radius: 8px;
}
</style>
