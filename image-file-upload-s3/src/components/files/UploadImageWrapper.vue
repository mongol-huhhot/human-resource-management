<!-- UploadImageWrapper.vue -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, onUpdated } from 'vue'
import UploadFile from './UploadImageAdvanced.vue'
import { useAppConfigStore } from '@/stores/AppConfigStore'
//import { useDBConnectionStore } from '@/stores/DBConnectionStore'
import { useFileStore } from '@/stores/useFileStore'

const configStore = useAppConfigStore()
configStore.loadFromWindow()

//const dbStore = useDBConnectionStore()

const props = defineProps({
  category_code: { type: String, default: 'mynumber_card' },
  owner_id: { type: String, default: '' },
  swapSizeInLandscape: { type: Boolean, default: true },
  compressRatio: { type: Number, default: 1 },   // 0.1 ~ 1 (e.g., 0.5 halves width/height)
  jpegQuality:  { type: Number, default: 0.9 },  // 0.1 ~ 1 (JPEG encode quality)
  outputFormat: { type: String, default: 'image/jpeg' }, // 'image/jpeg' | 'image/png' | 'image/webp'
  maxWidth:     { type: Number, default: 0 },    // optional hard cap; 0 = ignore
  maxHeight:    { type: Number, default: 0 },    // optional hard cap; 0 = ignore
})


// --- Config ---
const cfg = computed(() => (configStore.UploadFiles?.[props.category_code]) || {})
const files = computed(() => cfg.value.files || [])
const baseWidth = computed(() => cfg.value.width)
const baseHeight = computed(() => cfg.value.height)
const returnType = computed(() => cfg.value.returnType)
const editable = computed(() => (typeof cfg.value.editable === 'boolean' ? cfg.value.editable : true))

//useFileStoreのfilesref参照
const filesref = computed(() => fileStore.files)

console.log("baseHeight, baseWidth",baseHeight.value, baseWidth.value)

const fileStore = useFileStore()
const fileurl = ref([])

//selectedFile は、パソコンから選択したアップロード前のファイル本体を一時的に保存する場所
const category = ref('staff/profile')
const ownerType = ref('staff')
//const ownerId = ref('staff_11111')
const fileKind = ref('')
//const selectedFile = ref(null)


//入力されたテキストボックスの値をひとまとめにして、APIに送るためのオブジェクトを作る関数
const makeFileParams = () => ({
  category: category.value,
  owner_type: ownerType.value,
  owner_id: props.owner_id,
  file_kind: fileKind.value,
})

const loadFiles = async () => {
  // マイナンバーカードの表・裏をまとめて1回で取得する呼び出し例（サンプルデータ）
  await fileStore.loadFiles([
    {
        "owner_type": "staff",
        "owner_id": "staff_11111",
        "file_kind": "mynumber_card_front"
    },
    {
        "owner_type": "staff",
        "owner_id": "staff_11111",
        "file_kind": "mynumber_card_back"
    }
  ])

  for (const file of fileStore.files) {
    if (file.mime_type?.startsWith('image/')) {

      const preview = await fileStore.getPreviewUrl(file.file_uuid, {
        loading: false,
      })

      console.log("file==", file)
      console.log("preview==", preview)
      file.thumbnailUrl = preview?.url || null
      
      console.log("qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq=", fileurl.value)
      console.log(typeof thumbnailUrl)
    }
  }

  console.log("🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴",fileurl.value)
}


//テスト用propデータ
//これをDBから受け取る予定
//const props = {
//        category_code: 'mynumber_card',
//  swapSizeInLandscape: true,
//             identity: '',
//        compressRatio: 1,
//         jpegQuality:  0.9,
//         outputFormat: 'image/jpeg',
//         maxWidth: 0,
//         maxHeight:  0  
//}

// --- 重要な設定: 明示的なtidパスを保持 ---
//const tid = 'janga_vue_base_system'
//const readBlobURL = `/${tid}/dataEngine/v1/handleRequest/readImage.php`;


// --- Mobile detection ---
//画面サイズ（レスポンシブ）の判定
// パソコンとスマホ、あるいは画面の縦横切り替えによって、画像の並び方を自動で変えるための設定。
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

  loadFiles()
})

onBeforeUnmount(() => {
  if (mql) {
    if (mql.removeEventListener) mql.removeEventListener('change', updateIsMobile)
    else mql.removeListener(updateIsMobile)
  }
})

// --- Desktop layout mode ---
// レイアウトと画像サイズの計算（Computed）
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
// 子コンポーネント（画像枠）の追跡管理
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
// 画像の一括保存処理（saveAllImages）
const saveAllImages = async () => {
  saving.value = true
  saveResult.value = null
  saveProgress.value = 0
  
  await nextTick() // DOMの更新を確実にする
  
  try {
    // 1. アップロード対象（編集された画像）の抽出
    const validComponents = []
    
    for (let i = 0; i < files.value.length; i++) {
      const comp = childComponents.value[i]
      const fileConfig = files.value[i]
      
      if (!comp) {
        console.warn(`⚠️ Component not found for ${fileConfig.field} at index ${i}`)
        continue
      }
      
      // 有効な切り抜き画像があるか確認
      const isValid = hasValidCroppedImage(comp, fileConfig)
      
      if (isValid) {
        validComponents.push({ comp, fileConfig })
        console.log(`✅ Found valid cropped image for ${fileConfig.field}`)
      } else {
        console.log(`⏭️ Skipping ${fileConfig.field} (no valid cropped image)`)
      }
    }
    
    // 変更された画像が1枚もない場合は案内を出して終了
    if (validComponents.length === 0) {
      saveResult.value = {
        type: 'info',
        message: '編集された画像がありません。変更を加えてから保存してください。'
      }
      return
    }
    
    totalImages.value = validComponents.length
    console.log(`📸 Preparing to upload ${totalImages.value} images`)
    
    const results = []
    
    // 2. 各画像をループ処理で順番にアップロード
    for (let i = 0; i < validComponents.length; i++) {
      const { comp, fileConfig } = validComponents[i]
      
      try {
        // 必要に応じて切り抜き（トリミング）を確定させる
        if (typeof comp.getCropped === 'function') {
          console.log(`🔄 Triggered getCropped for ${fileConfig.field}`)
          comp.getCropped()
          // Canvasの生成・描画を待つ（0.5秒）
          await new Promise(resolve => setTimeout(resolve, 500))
        } else {
          console.warn(`⚠️ getCropped method not available for ${fileConfig.field}`)
        }
        
        // Base64テキスト形式の画像を、通信に適したBlob（バイナリ）形式に変換
        const blob = await fetchImageBlob(comp.croppedImage)
        
        // 新しい共通関数でアップロードを実行
        const result = await fileStore.uploadFile(
          blob,
          makeFileParams(),
        )
        
        if (result) {
          results.push({
            success: true,
            field: fileConfig.field,
            result: result
          })
          console.log(`✅ Successfully uploaded image for ${fileConfig.field}`)
        } else {
          throw new Error('アップロード結果が空、または処理に失敗しました。')
        }
        
      } catch (err) {
        console.error(`🖼️ 画像アップロードに失敗しました ${fileConfig.field}:`, err)
        results.push({
          success: false,
          field: fileConfig.field,
          error: err.message
        })
      } finally {
        // 進捗度（%）の計算と画面更新
        saveProgress.value = Math.round((i + 1) / totalImages.value * 100)
      }
    }
    
    // 3. アップロード結果の集計と画面リフレッシュ
    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length
    
    if (successCount > 0) {
      saveResult.value = {
        type: 'success',
        message: `✅ ${successCount} 件の画像を保存しました！`,
        details: results
      }
      
      // 子コンポーネントの編集状態（Base64の一時データ）をクリア
      for (let i = 0; i < childComponents.value.length; i++) {
        if (childComponents.value[i]) {
          childComponents.value[i].croppedImage = null
        }
      }
      
      // 【重要】新しい共通関数 `loadFiles` を用いて、サーバーの最新の画像状態を再取得（リフレッシュ）
      console.log('🔄 Reloading files via loadFiles...')
      const reloadParams = {
        category: category_code?.value || props?.category_code || 'default',
        owner_type: 'common',
        owner_id: identity?.value || props?.identity || 'none'
      }
      await loadFiles(reloadParams, { loading: false })
    }
    
    // 一部、または全部失敗した場合のエラーハンドリング
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
    // 成功・失敗に関わらず、最後にローディング状態と進捗をリセット
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

const handleDeleted = async (event) => {
  //console.log("fileConfig.field====", field)

const ok = await fileStore.softDeleteFile(event.identity)

  if (ok) {
    await loadFiles()
  }

  //const response = await dbStore.deleteImage(field_key(field))
  //console.log("response====", response)
}

const noimageurl = ""


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
          :fileurl=fileStore.thumbnailUrl
          :ref="(el) => setChildRef(el, index)"
          :label="fileConfig.headerName"
          labelPosition="top"
          :identity="props.identity"
          :width="visualWidth"
          :height="visualHeight"
          :returnType="returnType"
          :editable="editable"
          
          :src="fileConfig.url"
          :uuid="fileConfig.file_uuid"
          @cropped="(cropped) => handleCropped(fileConfig.field, cropped)"
          @deleted="handleDeleted"
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