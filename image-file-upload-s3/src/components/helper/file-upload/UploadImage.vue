<script setup>
import { ref } from 'vue'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

const props = defineProps({
  label: { type: String, default: 'Upload or Take Photo' },
  width: { type: Number, default: 200 },
  height: { type: Number, default: 200 },
  editable: { type: Boolean, default: true },  // Prop to toggle editing state
  returnType: { type: String, default: 'blob' }, // 'blob' or 'base64'
  identity: { type: String },  // Identity field (optional)
  existingImage: { type: String, default: '' },  // To hold the URL of the existing image
  src: { type: String, default: '' },  // Source image URL or base64
})

const emit = defineEmits(['cropped'])
const file = ref(null)
const imageData = ref(null)
const cropper = ref(null)

const previewUrl = ref(null)
const croppedImage = ref(null)

const showCropper = ref(true) // To toggle visibility of cropper after cropping
const imageUploaded = ref(true) // To track whether an image has been uploaded or cropped

// For showing the popup
const showDialog = ref(false) // Controls the dialog visibility
const imageSource = ref(props.src || props.existingImage)

const getCropped = () => {
  if (!cropper.value) return

  if (props.returnType === 'base64') {
    cropper.value.getCropData((dataUrl) => {
      croppedImage.value = dataUrl // Store cropped image preview
      previewUrl.value = dataUrl
      showCropper.value = false // Hide cropper and show cropped image
      imageUploaded.value = true // Set imageUploaded to true after cropping
      emit('cropped', { base64: dataUrl })
    })
  } else {
    cropper.value.getCropBlob((blob) => {
      croppedImage.value = URL.createObjectURL(blob) // Store cropped image preview
      previewUrl.value = URL.createObjectURL(blob)
      showCropper.value = false // Hide cropper and show cropped image
      imageUploaded.value = true // Set imageUploaded to true after cropping
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
  }
  reader.readAsDataURL(selectedFile)

  imageUploaded.value = true // Set imageUploaded to true when a file is uploaded
}

const resetCropper = () => {
  imageData.value = null // Reset the image data
  croppedImage.value = null // Reset the cropped image
  showCropper.value = true // Show the cropper interface again
  imageUploaded.value = false // Allow re-upload of a new image
}

const openDialog = () => {
  showDialog.value = true // Open the dialog
}

const closeDialog = () => {
  showDialog.value = false // Close the dialog
}

defineExpose({
  getCropped,
  resetCropper,
})

console.log('UploadImage component - editable:', props)  
</script>

<template>
  <div class="upload-image-container">
    <!-- {{ width }} x {{ height }} px -->
    <!-- Display existing image when editable is false -->
    <div v-if="!editable && (imageSource || existingImage)" class="image-preview">
      <label v-if="label" class="upload-label">{{ label }}</label>
      <img :src="imageSource || existingImage" class="mt-4 image-zoom"
        :style="{
          width: `${width}px`,
          border: '1px dashed #ccc',
        }"
        @click="openDialog"
      />

    </div>

    <!-- File Upload and Cropper Interface (only when editable is true and no image uploaded) -->
    <div v-if="editable && !imageUploaded && !imageData && !croppedImage">
      <v-file-input
        v-model="file"
        accept="image/*"
        :label="label"
        capture="environment"
        @change="onFileChange"
        class="file-input"
      />
    </div>

    <div v-if="editable && imageData && showCropper" class="cropper-wrapper">
      <div>{{ label }}</div>
      <vue-cropper
        ref="cropper"
        :img="imageData"
        :autoCrop="true"
        :autoCropWidth="width"
        :autoCropHeight="height"
        style="height: 200px; width: 100%;"
      />
      <v-btn v-if="imageData && !croppedImage" color="primary" class="mt-2" @click="getCropped">切取る</v-btn>
    </div>

    <!-- Cropped Image Preview -->
    <div v-if="editable && (croppedImage || imageSource || existingImage)">
      <div>{{ label }}</div>
      <!-- aaaaaa -->
      <v-img
        :src="croppedImage || imageSource || existingImage"
        :max-width="width"
        class="mt-4 image-zoom"
        @click="openDialog"
      />
      <v-btn color="secondary" class="mt-2" @click="resetCropper">リセット</v-btn>
    </div>

    <!-- Dialog to display image in a larger view -->
    <v-dialog v-model="showDialog" max-width="90%" persistent>
      <v-img
        :src="croppedImage || imageSource || existingImage"
        height="500px"
        contain
      />
      <v-btn color="primary" @click="closeDialog">Close</v-btn>
    </v-dialog>
  </div>
</template>

<style scoped>
.upload-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;  /* Add space between images */
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

.mt-4 {
  margin-top: 16px;
}

/* Ensure all images are the same size */
.image-zoom {
  transition: transform 0.3s ease, filter 0.3s ease;
  width: 100%;  /* Ensure it takes full width */
  max-width: 200px;  /* Set max width for consistency */
  height: auto;
}

.image-zoom:hover {
  transform: scale(1.8);
  filter: brightness(1.2);
  cursor: zoom-in;
}
</style>
