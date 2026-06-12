<!-- UploadImageWrapper.vue -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, onUpdated } from 'vue'
import UploadFile from './UploadImageAdvanced.vue'
import { useAppConfigStore } from '@/stores/AppConfigStore'
import { useFileStore } from '@/stores/useFileStore'
//import { any } from 'core-js/fn/promise'

const configStore = useAppConfigStore()
configStore.loadFromWindow()

// 1. 初期状態は「未完了（false）」にしておく
const isInitialized = ref(false)

const props = defineProps({
  tabCode:             { type: String, default: '' }, // ex) basic,bank,...
  categoryCode:        { type: String, default: '' }, // ex) mynumber_card,...
  ownerType:           { type: String, default: 'staff' }, // ex) staff,... 
  ownerId:             { type: String, default: '' }, // ex) 11111,22222,...
  swapSizeInLandscape: { type: Boolean, default: true }, // ex) 
  compressRatio:       { type: Number, default: 1 },   // 0.1 ~ 1 (e.g., 0.5 halves width/height)
  jpegQuality:         { type: Number, default: 0.9 },  // 0.1 ~ 1 (JPEG encode quality)
  outputFormat:        { type: String, default: 'image/jpeg' }, // 'image/jpeg' | 'image/png' | 'image/webp'
  maxWidth:            { type: Number, default: 0 },    // optional hard cap; 0 = ignore
  maxHeight:           { type: Number, default: 0 },    // optional hard cap; 0 = ignore
})

console.log("UploadImageWrapper.props================",props)

// ★ 1. propsからユニークなストアIDを組み立てる
// 例: "fileStore_staff_22222_mynumber_card"
const uniqueStoreId = computed(() => {
  return `fileStore_${props.ownerType}_${props.ownerId}_${props.categoryCode}`
})

// ★ 2. 動的IDを渡して、このコンポーネント専用のストアインスタンスを取得する
// 引数にIDを渡し、戻ってきた関数をさらに実行 () します
const fileStore = useFileStore(uniqueStoreId.value)()

// --- Config ---
const cfg = computed(() => (configStore.UploadFiles?.[props.categoryCode]) || {})
const files = computed(() => cfg.value.files || [])
const baseWidth = computed(() => cfg.value.width)
const baseHeight = computed(() => cfg.value.height)
const returnType = computed(() => cfg.value.returnType)
const editable = computed(() => (typeof cfg.value.editable === 'boolean' ? cfg.value.editable : true))
const computedurl = computed(() => (fileStore.UploadFiles?.[props.categoryCode]) || {})

console.log("cfg.value.files======================",files.value)
console.log("baseHeight, baseWidth",baseHeight.value, baseWidth.value)


/**
 * テンプレートの field ('front' / 'back') から
 * ストア内の対応する file_kind を検索して thumbnailUrl を返す
 */
const imgUrl = (field) => {
  // 探したい完全な file_kind 文字列を組み立てる (例: "mynumber_card_front")
  const targetKind = `${props.categoryCode}_${field}`
  
  // ストアの配列から合致するデータを見つける
  const matchedFile = (fileStore.files || []).find(file => file.file_kind === targetKind)
  
  console.log("matchedFile ? matchedFile.thumbnailUrl==========", matchedFile ? matchedFile.thumbnailUrl: "")
  // 見つかればそのサムネイルURL、なければ個別で指定の値を返す
  return matchedFile ? matchedFile.thumbnailUrl : null
}

const imguuid = (field) => {
  // 探したい完全な file_kind 文字列を組み立てる (例: "mynumber_card_front")
  const targetKind = `${props.categoryCode}_${field}`
  
  // ストアの配列から合致するデータを見つける
  const matchedFile = (fileStore.files || []).find(file => file.file_kind === targetKind)
  
  console.log("matchedFile ? matchedFile.thumbnailUrl==========", matchedFile ? matchedFile.thumbnailUrl: "")
  // 見つかればそのサムネイルURL、なければ個別で指定の値を返す
  return matchedFile ? matchedFile.file_uuid : null
}


/**
 * 引数で受け取った field（'mynumber_card_front' や 'mynumber_card_back' など）をもとに、
 * ファイル操作に必要なパラメーターオブジェクトを生成する
 */
const makeFileParams = (field) => {
  // owner_id を 'staff_11111' の形式に組み立て
  const formattedOwnerId = `${props.ownerType}_${props.ownerId}`

  // tabCode を 'staff/profile' の形式に組み立て
  const formattedCategory = `${props.ownerType}/${props.tabCode}`

  return {
    category:   formattedCategory,                         // 例: "staff/profile"
    owner_type: props.ownerType,                           // 例: "staff"
    owner_id:   formattedOwnerId,                          // 例: "staff_11111"
    file_kind:  `${props.categoryCode}_${field}`           // 例: "mynumber_card_front"
  }
}

//makeFileParamsをloadfiles用に改良したもの
//uploadfilesのパラメーターにはmakeFileParamsメソッドを使用（要改善）
const filePayloadList = computed(() => {
  // owner_id を 'staff_11111' の形式に組み立て
  const formattedOwnerId = `${props.ownerType}_${props.ownerId}`

  // tabCode を 'staff/profile' の形式に組み立て
  //Categoryという名前はtbx.filesテーブルのcategoryカラムから
  const formattedCategory = `${props.ownerType}/${props.tabCode}`

  // files 配列を map 処理して、指定のオブジェクト構造に変換
  return files.value.map(file => {
    return {
      category: formattedCategory,
      owner_type: props.ownerType,                         // "staff"
      owner_id:   formattedOwnerId,                        // "staff_11111"
      file_kind:  `${props.categoryCode}_${file.field}`     // "mynumber_card_front" 形式
    }
  })
})
// --- デバッグ・確認用 ---
 console.log("filePayloadList==================",JSON.stringify(filePayloadList.value, null, 2))

const loadFiles = async () => {

  try {
  // マイナンバーカードの表・裏をまとめて1回で取得する呼び出し例（サンプルデータ）
  await fileStore.loadFiles(filePayloadList.value)

    for (const file of fileStore.files) {
      if (file.mime_type?.startsWith('image/')) {
  
        const preview = await fileStore.getPreviewUrl(file.file_uuid, {
          loading: false,
        })
  
        //console.log("file==", file)
        //console.log("preview==", preview)
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
    // 【新規追加】2. 編集前の元画像（古い画像）を特定し、一括で物理削除
    // -------------------------------------------------------------
    console.log('🧹 編集された枠の古い元画像を特定しています...')
    const deleteTargets = []

    for (const { fileConfig } of validComponents) {
      // 現在ストアに保持されている最新ファイル群 (fileStore.files) から、
      // 今回編集されたフィールド（例: 'front' や 'back'）に対応する既存の画像データを検索
      // ※紐付け条件がfile_kindとfieldの結合（例: category_front）の場合は適宜調整してください
      const existingFile = fileStore.files.find(
        f => f.file_kind === `${props.categoryCode}_${fileConfig.field}`
      )

      if (existingFile && existingFile.file_uuid) {
        deleteTargets.push({
          uuid: existingFile.file_uuid,
          field: existingFile.file_kind
        })
      }
    }

    // 古い画像が存在する場合のみ削除フェーズを実行
    if (deleteTargets.length > 0) {
      console.log(`🗑️ ${deleteTargets.length} 件の古い元画像を物理削除します...`)
      
      for (const target of deleteTargets) {
        // deleteFileのローディングが全体と衝突しないよう options で伝播UIを制御
        const isDeleted = await fileStore.deleteFile(target.uuid, { 
          loading: true, 
          loadingText: `${target.field} の古い画像を削除中...`,
          showSuccessMessage: false // 一括処理なので個別の「成功しました」トーストは消す
        })

        // トランザクション制御：1件でも削除に失敗したら、新しい画像のアップロードに進まずエラー中断する
        if (!isDeleted) {
          throw new Error(`${target.field} の古い画像の削除に失敗したため、処理を中断しました。`)
        }
      }
      console.log('✅ すべての古い元画像の削除が完了しました。')
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
        if (typeof comp.getCropped === 'function') {
          comp.getCropped()
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
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




</script>

<template>


  <section class="wrapper" >
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
          :uuId="imguuid(fileConfig.field)"
          :width="visualWidth"
          :height="visualHeight"
          :returnType="returnType"
          :editable="editable"
          :src="imgUrl(fileConfig.field)"
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