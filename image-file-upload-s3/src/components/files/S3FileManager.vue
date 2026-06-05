<script setup>
import { ref, onMounted } from 'vue'
import { useFileStore } from '@/stores/useFileStore'

const fileStore = useFileStore()


//Vuetifyのテーブル（v-data-table）の列を定義
//title が画面に見える文字、key がデータ（ファイル情報）のどの項目を紐付けるかを表す
const headers = [
  { title: 'Preview', key: 'thumbnailUrl', sortable: false },
  { title: 'File_uuid', key: 'file_uuid' },
  { title: 'Category', key: 'category' },
  { title: 'Owner_type', key: 'owner_type' },
  { title: 'Owner_id', key: 'owner_id' },
  { title: 'File_kind', key: 'file_kind' },
  { title: 'Original_name', key: 'original_name' },
  { title: 'Mime_type', key: 'mime_type' },
  { title: 'File_size', key: 'file_size' },
  { title: 'Created_by', key: 'created_by' },
  { title: 'Created_at', key: 'created_at' },
  { title: '操作', key: 'actions', sortable: false },
]

//selectedFile は、パソコンから選択したアップロード前のファイル本体を一時的に保存する場所
const category = ref('staff/profile')
const ownerType = ref('staff')
const ownerId = ref('staff_11111')
const fileKind = ref('thumbnail')
const selectedFile = ref(null)


//入力されたテキストボックスの値をひとまとめにして、APIに送るためのオブジェクトを作る関数
const makeFileParams = () => ({
  category: category.value,
  owner_type: ownerType.value,
  owner_id: ownerId.value,
  file_kind: fileKind.value,
})

//<input type="file"> でファイルが選ばれたときに動き、
// 選ばれた1つ目のファイル（[0]）を selectedFile に代入
const onFileChange = (event) => {
  selectedFile.value = event.target.files?.[0] || null
}


//画面を開いたときや、再読み込みしたときに動く中心的な処理
//ファイルの種類（mime_type）が image/jpeg などの画像だった場合、セキュアにアクセスできる一時的なURL（プレビューURL）を裏で取得し、
// テーブル表示用のデータに thumbnailUrl として追加
const loadFiles = async () => {
  await fileStore.loadFiles(makeFileParams())

  for (const file of fileStore.files) {
    if (file.mime_type?.startsWith('image/')) {
      const preview = await fileStore.getPreviewUrl(file.file_uuid, {
        loading: false,
      })

      file.thumbnailUrl = preview?.url || null
    }
  }
}

//アップロード関数
const upload = async () => {
  const result = await fileStore.uploadFile(
    selectedFile.value,
    makeFileParams(),
  )

  if (result) {
    selectedFile.value = null
    await loadFiles()
  }
}

//リロード関数
const reload = async () => {
  await loadFiles()
}

//プレビュー表示関数
const preview = async (fileUuid) => {
  await fileStore.previewFile(fileUuid)
}

//ダウンロード関数
const download = async (fileUuid) => {
  await fileStore.downloadFile(fileUuid)
}

//削除関数
const remove = async (fileUuid) => {
  if (!confirm('このファイルを削除しますか？')) return

  const ok = await fileStore.softDeleteFile(fileUuid)

  if (ok) {
    await loadFiles()
  }
}

onMounted(loadFiles)

</script>

<template>
  <div class="s3-file-manager">
    <h3>S3ファイル管理</h3>

    <div class="toolbar">
      <input v-model="category" placeholder="category" />
      <input v-model="ownerType" placeholder="owner_type" />
      <input v-model="ownerId" placeholder="owner_id" />
      <input v-model="fileKind" placeholder="file_kind" />

      <button @click="reload">
        再読込
      </button>
    </div>

    <div class="upload-box">
      <input type="file" @change="onFileChange" />

      <button :disabled="!selectedFile" @click="upload">
        アップロード
      </button>
    </div>

    <v-data-table
      :headers="headers"
      :items="fileStore.files"
    >
      <template #item.thumbnailUrl="{ item }">
        <v-avatar size="48" rounded color="grey-lighten-3">
          <v-img
            v-if="item.mime_type?.startsWith('image/') && item.thumbnailUrl"
            :src="item.thumbnailUrl"
            cover
          />

          <v-icon v-else-if="item.mime_type === 'application/pdf'">
            mdi-file-pdf-box
          </v-icon>

          <v-icon
            v-else-if="
              item.mime_type?.includes('spreadsheet') ||
              item.mime_type?.includes('excel')
            "
          >
            mdi-file-excel
          </v-icon>

          <v-icon v-else-if="item.mime_type === 'text/csv'">
            mdi-file-delimited
          </v-icon>

          <v-icon v-else>
            mdi-file
          </v-icon>
        </v-avatar>
      </template>

      <template #item.actions="{ item }">
        <v-btn size="small" variant="text" @click="preview(item.file_uuid)">
          表示
        </v-btn>

        <v-btn size="small" variant="text" @click="download(item.file_uuid)">
          DL
        </v-btn>

        <v-btn
          size="small"
          variant="text"
          color="error"
          @click="remove(item.file_uuid)"
        >
          削除
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<style scoped>
.s3-file-manager {
  padding: 16px;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.upload-box {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
