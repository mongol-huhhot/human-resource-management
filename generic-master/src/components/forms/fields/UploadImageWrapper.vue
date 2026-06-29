<!-- UploadImageWrapper.vue -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, onUpdated,watch } from 'vue'
import UploadFile from './UploadImageAdvanced.vue'
import { useAppConfigStore } from '@/stores/AppConfigStore'
import { useFileStore } from '@/stores/useFileStore'

const configStore = useAppConfigStore()
configStore.loadFromWindow()

// 1. 初期状態は「未完了（false）」にしておく
const isInitialized = ref(false)

const props = defineProps({
  // 1つにまとめたメタ情報オブジェクト
  meta: {
    type: Object,
    default: () => ({
      categoryCode: '',        // ex) basic, bank, ...
      documentType: '',   // ex) mynumber_card, ...
      ownerType: 'staff', // ex) staff, ...
      ownerId: '',        // ex) 11111, 22222, ...
      recordId: '',        // ex) 
    })
  },
  
})

console.log("UploadImageWrapper.props================",props)

// ★ 1. propsからユニークなストアIDを組み立てる
// 例: "fileStore_staff_22222_mynumber_card"
// const uniqueStoreId = computed(() => {
//   return `fileStore_${props.meta.ownerType}_${props.meta.ownerId}_${props.meta.documentType}`
// })

// ★ 2. 動的IDを渡して、このコンポーネント専用のストアインスタンスを取得する
// 引数にIDを渡し、戻ってきた関数をさらに実行 () します
const fileStore = useFileStore()

// --- Config ---
const cfg = computed(() => (configStore.UploadFiles?.[props.meta.documentType]) || {})
const files = computed(() => cfg.value.files || [])
const baseWidth = computed(() => cfg.value.width)
const baseHeight = computed(() => cfg.value.height)
const returnType = computed(() => cfg.value.returnType)
const editable = computed(() => (typeof cfg.value.editable === 'boolean' ? cfg.value.editable : true))
const swapSizeInLandscape = computed(() => cfg.value.swapSizeInLandscape)
const compressRatio       = computed(() => cfg.value.compressRatio)
const jpegQuality         = computed(() => cfg.value.jpegQuality)
const outputFormat        = computed(() => cfg.value.outputFormat)
const maxWidth            = computed(() => cfg.value.maxWidth)
const maxHeight           = computed(() => cfg.value.maxHeight)

const fileKey = computed(() => {
  return props.meta.recordId
    ? `${props.meta.documentType}#${props.meta.recordId}`
    : props.meta.documentType
})

console.log("cfg.value.files======================",files.value)
console.log("baseHeight, baseWidth",baseHeight.value, baseWidth.value)


/**
 * テンプレートの field ('front' / 'back') から
 * ストア内の対応する file_kind を検索して thumbnailUrl を返す
 */
const imgUrl = (field) => {
  // 探したい完全な file_kind 文字列を組み立てる (例: "mynumber_card_front")
  const targetKind = `${props.meta.documentType}_${field}`
  
  // ストアの配列から合致するデータを見つける
  const matchedFile = (fileStore.files[fileKey.value] || []).find(file => file.file_kind === targetKind)
  
  //console.log("matchedFile ? matchedFile.thumbnailUrl==========", matchedFile ? matchedFile.thumbnailUrl: "")
  // 見つかればそのサムネイルURL、なければ個別で指定の値を返す
  return matchedFile ? matchedFile.thumbnailUrl : null
}

const imguuid = (field) => {
  // 探したい完全な file_kind 文字列を組み立てる (例: "mynumber_card_front")
  const targetKind = `${props.meta.documentType}_${field}`
  
  // ストアの配列から合致するデータを見つける
  const matchedFile = (fileStore.files[fileKey.value] || []).find(file => file.file_kind === targetKind)
  
  //console.log("matchedFile ? matchedFile.thumbnailUrl==========", matchedFile ? matchedFile.thumbnailUrl: "")
  // 見つかればそのサムネイルURL、なければ個別で指定の値を返す
  return matchedFile ? matchedFile.file_uuid : null
}


/**
 * 引数で受け取った field（'mynumber_card_front' や 'mynumber_card_back' など）をもとに、
 * ファイル操作に必要なパラメーターオブジェクトを生成する
 */
const makeFileParams = (field) => {
  // owner_id を 'staff_11111' の形式に組み立て
  const formattedOwnerId = `${props.meta.ownerType}_${props.meta.ownerId}`

  // categoryCode を 'staff/profile' の形式に組み立て
  const formattedCategory = `${props.meta.ownerType}/${props.meta.categoryCode}`

  return {
    category:   formattedCategory,                         // 例: "staff/profile"
    owner_type: props.meta.ownerType,                           // 例: "staff"
    owner_id:   formattedOwnerId,                          // 例: "staff_11111"
    file_kind:  `${props.meta.documentType}_${field}`,           // 例: "mynumber_card_front"
    record_id:   props.meta.recordId,
  }
}

//makeFileParamsをloadfiles用に改良したもの
//uploadfilesのパラメーターにはmakeFileParamsメソッドを使用（要改善）
const filePayloadList = computed(() => {
  // owner_id を 'staff_11111' の形式に組み立て
  const formattedOwnerId = `${props.meta.ownerType}_${props.meta.ownerId}`

  // categoryCode を 'staff/profile' の形式に組み立て
  //Categoryという名前はtbx.filesテーブルのcategoryカラムから
  const formattedCategory = `${props.meta.ownerType}/${props.meta.categoryCode}`

  // files 配列を map 処理して、指定のオブジェクト構造に変換
  return files.value.map(file => {
    return {
      category: formattedCategory,
      owner_type: props.meta.ownerType,                         // "staff"
      owner_id:   formattedOwnerId,                        // "staff_11111"
      file_kind:  `${props.meta.documentType}_${file.field}`,     // "mynumber_card_front" 形式
      record_id:   props.meta.recordId,
      //document_type: props.meta.documentType,
    }
  })
})
// --- デバッグ・確認用 ---
 //console.log("filePayloadList==================",JSON.stringify(filePayloadList.value, null, 2))

 //デバッグ用
watch(
  () => filePayloadList,
  (val) => {
    console.log('filePayloadList changed', val)
  },
  { deep: true, immediate: true }
)

const loadFiles = async () => {

  try {
  // マイナンバーカードの表・裏をまとめて1回で取得する呼び出し例（サンプルデータ）

    await fileStore.loadFiles(
      {
        //document_type: props.meta.documentType,
        //filestoreでもdocument_typeではなくfile_keyを参照するように変更
        file_key:fileKey.value,
        filters: filePayloadList.value,
      }
    )


    for (const file of fileStore.files[fileKey.value] || []) {

    //for (const file of fileStore.files[props.meta.documentType]) {
      if (file.mime_type?.startsWith('image/')) {
  
        const preview = await fileStore.getPreviewUrl(file.file_uuid, {
          loading: false,
        })
  
        //console.log("file==", file)
        //console.log("preview==", preview)
        console.log("filegetpreviewurl=======",preview?.url || null)
        file.thumbnailUrl = preview?.url || null
      }
    }
  }catch (error) {
    console.error("初期化エラー:", error)
  } finally {
    // 2. データの取得、およびURLのセット（一連の処理）が「すべて終わったら」trueにする
    isInitialized.value = true
  }
}

// --- Mobile detection ---
//画面サイズ（レスポンシブ）の判定
// パソコンとスマホ、あるいは画面の縦横切り替えによって、画像の並び方を自動で変えるための設定。
const isMobile = ref(false)
let mql = null

const updateIsMobile = () => {
  isMobile.value = window.matchMedia('(max-width: 768px)').matches
}

onMounted(() => {
  loadFiles()
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
    // -------------------------------------------------------------
    // 1. アップロード対象（編集された画像）の抽出
    // -------------------------------------------------------------
    const validComponents = []
    
    for (let i = 0; i < files.value.length; i++) {
      const comp = childComponents.value[i]
      const fileConfig = files.value[i]
      
      if (!comp) continue
      
      const isValid = hasValidCroppedImage(comp, fileConfig)
      if (isValid) {
        validComponents.push({ comp, fileConfig })
      }
    }
    
    if (validComponents.length === 0) {
      saveResult.value = {
        type: 'info',
        message: '編集された画像がありません。変更を加えてから保存してください。'
      }
      return
    }

    // -------------------------------------------------------------
    // 3. 各新しい画像をループ処理で順番にアップロード（後半戦）
    // -------------------------------------------------------------
    totalImages.value = validComponents.length
    console.log(`📸 Preparing to upload ${totalImages.value} images`)
    
    const results = []
    
    for (let i = 0; i < validComponents.length; i++) {
      const { comp, fileConfig } = validComponents[i]
      
      try {
        
        const blob = await fetchImageBlob(comp.croppedImage)
        
        // アップロード実行
        const result = await fileStore.uploadFile(
          blob,
          makeFileParams(fileConfig.field), // 画像の種類を特定できるように引数を調整
        )
        
        if (result) {
          results.push({ success: true, field: fileConfig.field, result: result })
        } else {
          throw new Error('アップロード結果が空、または処理に失敗しました。')
        }
        
      } catch (err) {
        console.error(`🖼️ 画像アップロードに失敗しました ${fileConfig.field}:`, err)
        results.push({ success: false, field: fileConfig.field, error: err.message })
      } finally {
        saveProgress.value = Math.round((i + 1) / totalImages.value * 100)
      }
    }
    
    // -------------------------------------------------------------
    // 4. アップロード結果の集計と画面リフレッシュ
    // -------------------------------------------------------------
    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length
    
    if (successCount > 0) {
      saveResult.value = {
        type: 'success',
        message: `✅ ${successCount} 件の画像を保存しました！`,
        details: results
      }
      
      // 子コンポーネントの編集状態をクリア
      for (let i = 0; i < childComponents.value.length; i++) {
        if (childComponents.value[i]) {
          childComponents.value[i].croppedImage = null
        }
      }
      
      // サーバーの最新状態を再取得（物理削除＋新規アップロードの最終結果を反映）
      await loadFiles(filePayloadList.value, { loading: false })
    }
    
    if (errorCount > 0) {
      const errorMsg = saveResult.value 
        ? saveResult.value.message + ` (${errorCount} 件失敗)`
        : `❌ ${errorCount} 件の画像保存に失敗しました`
      
      saveResult.value = { type: 'error', message: errorMsg, details: results.filter(r => !r.success) }
    }
    
  } catch (err) {
    // 削除失敗、または致命的エラー時のハンドリング
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

  //論理削除か物理削除かは任意で変更してください
const ok = await fileStore.softDeleteFile(event.uuid, { 
          loading: true, 
          loadingText: `選択画像を削除中...`,
          showSuccessMessage: true
        })

if (ok) {
    await loadFiles()
  }
}

//デバッグ用
watch(
  () => props.meta,
  (val) => {
    console.log('meta changed', val)
  },
  { deep: true, immediate: true }
)

//デバッグ用
watch(
  () => fileKey,
  (val) => {
    console.log('fileKey changed', val)
  },
  { deep: true, immediate: true }
)

watch(
  () => [
    props.meta.ownerId,
    // props.meta.documentType,
    // props.meta.categoryCode,
    // props.meta.ownerType
  ],
  async (newVal, oldVal) => {
    if (!oldVal) return

    console.log('🔄 meta changed', {
      old: oldVal,
      new: newVal
    })

    //isInitialized.value = false

    await loadFiles()
  }
)


</script>

<template>

<v-row>
  <v-col
    v-for="(fileConfig, index) in files"
    :key="fileConfig.field"
    cols="12"
    sm="6"
    md="4"
  >
    <UploadFile
    :ref="(el) => setChildRef(el, index)"
          :label="fileConfig.headerName"
          labelPosition="top"
          :uuId="imguuid(fileConfig.field)"
          :width="visualWidth"
          :height="visualHeight"
          :returnType="returnType"
          :editable="editable"
          :src="imgUrl(fileConfig.field)"
          @cropped="(cropped) => handleCropped(fileConfig.field, cropped)"
          @deleted="handleDeleted"
          :compressRatio="compressRatio"
          :jpegQuality="jpegQuality"
          :outputFormat="outputFormat"
          :maxWidth="maxWidth"
          :maxHeight="maxHeight"
    />
  </v-col>
</v-row>

<!-- <div class="d-flex flex-column align-center ga-4 mt-6">

  <v-btn
    color="primary"
    size="large"
    prepend-icon="mdi-content-save"
    :loading="saving"
    @click="saveAllImages"
  >
    画像を保存
  </v-btn>

  <v-alert
    v-if="saveResult"
    :type="saveResult.type"
    variant="tonal"
    max-width="500"
  >
    {{ saveResult.message }}
  </v-alert>

</div> -->


<v-alert
  v-if="saveResult"
  :type="saveResult.type"
  variant="tonal"
  class="mt-4"
>
  {{ saveResult.message }}
</v-alert>

<div class="d-flex justify-end mt-6">
  <v-btn
    color="primary"
    size="large"
    prepend-icon="mdi-content-save"
    :loading="saving"
    @click="saveAllImages"
  >
    画像を保存
  </v-btn>
</div>

</template>