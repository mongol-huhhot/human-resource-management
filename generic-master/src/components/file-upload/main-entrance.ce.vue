<!-- <script setup>
import UploadImageWrapper from './UploadImageWrapper.vue';
import { defineProps } from 'vue'

const props = defineProps({
  category_code: { type: String, default: 'student_card' }, // 種類変更。例えば、学生証、マイナンバーカードなど
  swapSizeInLandscape: { type: Boolean, default: true },    // 横(true、デフォルト)に表示か縦(false)に表示するか
  identity: { type: String, default: '' }               // 種類のなかの識別。例えば、'2025'の保険書など
})
console.log("mmmmmmmmmmmmmmmmmmmmmmmmmmmmmm=", props.category_code, props.swapSizeInLandscape, props.identity)
</script> -->

<!-- src/components/main-entrance.ce.vue -->
<script setup>
import { computed, defineProps } from 'vue'
import UploadImageWrapper from './UploadImageWrapper.vue'
// import CameraBox from './CameraBox.vue'
import CameraLongSheet from './CameraLongSheet.vue'

/***
 * to make this component more flexible for variaties of requests even on a single page, we set properties instead of set them into config file!!!
 */
const props = defineProps({
  // ⬅️ NOTE names are camelCase here and must match kebab-case attributes below:
  categoryCode: { type: String, required:true },     // attribute: category-code
  identity:     { type: String, default: '' },       // attribute: identity, extra property to identify different year has differnt image
  swapSizeInLandscape: { type: [Boolean, String], default: true }, // attribute: swap-size-in-landscape
  compressRatio: { type: Number, default: 1 },   // 0.1 ~ 1 (e.g., 0.5 halves width/height)
  jpegQuality:  { type: Number, default: 0.9 },  // 0.1 ~ 1 (JPEG encode quality)
  outputFormat: { type: String, default: 'image/jpeg' }, // 'image/jpeg' | 'image/png' | 'image/webp'
  maxWidth:     { type: Number, default: 0 },    // optional hard cap; 0 = ignore
  maxHeight:    { type: Number, default: 0 },    // optional hard cap; 0 = ignore
})

console.log("main-entrance.ce.vue, props," , props)


// normalize boolean coming from attributes ("", "true", "false", etc.)
// const swapNormalized = computed(() => {
//   const v = props.swapSizeInLandscape
//   if (v === true || v === false) return v
//   if (v == null) return false
//   const s = String(v).toLowerCase()
//   return s === '' || s === 'true' || s === '1' || s === 'yes'
// })

/** Robust Boolean coercion for CE attributes */
const toBool = (v, fallback = false) => {
  if (typeof v === 'boolean') return v
  if (v == null) return fallback
  const s = String(v).trim().toLowerCase()
  return s === '' || s === 'true' || s === '1' || s === 'yes' || s === 'on'
}

const swapNormalized = computed(() => toBool(props.swapSizeInLandscape, true))

</script>

<template>
  <!-- <CameraLongSheet /> -->
  <!-- <CameraBox/> -->
  <UploadImageWrapper
    :category_code="props.categoryCode"
    :identity="props.identity"
    :swapSizeInLandscape="swapNormalized"
    :compressRatio="props.compressRatio"
    :jpegQuality="props.jpegQuality"
    :outputFormat="props.outputFormat"
    :maxWidth="props.maxWidth"
    :maxHeight="props.maxHeight"
  />
</template>
<!-- <template>
    <UploadImageWrapper :category_code="props.category_code" :swapSizeInLandscape="props.swapSizeInLandscape" :identity="props.identity" />
</template> -->
