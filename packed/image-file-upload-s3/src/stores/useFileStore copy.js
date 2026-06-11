// stores/useFileStore.js
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { showSnackbar } from '@/utils/SnackBar.vue'
import { showLoading, hideLoading } from '@/utils/loadingService'

export const useFileStore = defineStore('fileStore', () => {
  const DEFAULT_TID = 'premier'

  //サーバーから取得した「ファイル一覧のデータ」を格納しておくための、画面と連動する配列
  const files = ref([])

  //現在選択されている単一のファイル情報を保持するための場所
  const currentFile = ref(null)

  const commonConstants = reactive({
    FILE_API_URL: '/dataEngine/v5/file_api.php',
  })

  const commonParams = reactive({
    tid: DEFAULT_TID,
  })

  const notice = (message, level = 'info') => {
    try {
      showSnackbar(message, level)
    } catch (e) {
      console.warn('[useFileStore] showSnackbar failed:', e)
    }
  }

  const startLoading = (message = '処理中です...') => {
    try {
      showLoading(message)
    } catch (e) {
      console.warn('[useFileStore] showLoading failed:', e)
    }
  }

  const stopLoading = () => {
    try {
      hideLoading()
    } catch (e) {
      console.warn('[useFileStore] hideLoading failed:', e)
    }
  }

  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || ''
  }

  function detectTid() {
    if (typeof window === 'undefined') return commonParams.tid

    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return commonParams.tid
    }

    const segs = window.location.pathname.split('/').filter(Boolean)
    return segs[0] || commonParams.tid
  }

  const buildUrl = (endpoint = commonConstants.FILE_API_URL) => {
    const tid = detectTid()
    const ep = String(endpoint).replace(/^\/+/, '')
    return `/${tid}/${ep}`
  }

  //サーバーから返ってきた結果が、綺麗なJSON形式（プログラムが読める形）データかどうかをチェックし、
  // 壊れていればエラー用のデータを返す
  const parseResponse = async (response) => {
    const text = await response.text()

    try {
      return JSON.parse(text)
    } catch (e) {
      return {
        COMMON: {
          code: -9,
          message: text || 'JSON parse error',
          result: null,
        },
      }
    }
  }

  const access = async ({
    method = 'GET',
    action,
    params = {},
    formData = null,
    loading = true,
    loadingText = '処理中です...',
    requireAuth = true,
    timeoutMs = 30000,
  }) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    if (loading) startLoading(loadingText)

    try {
      const headers = {}

      if (requireAuth) {
        const token = getToken()
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }
      }

      let url = buildUrl()

      const options = {
        method,
        headers,
        signal: controller.signal,
        credentials: 'include',
      }

      if (method === 'GET') {
        const query = new URLSearchParams({
          action,
          ...params,
        })

        url = `${url}?${query.toString()}`
      } else {
        const body = formData || new FormData()
        body.append('action', action)

        Object.keys(params || {}).forEach((key) => {
          if (params[key] !== undefined && params[key] !== null) {
            body.append(key, params[key])
          }
        })

        options.body = body
      }

      const response = await fetch(url, options)
      const json = await parseResponse(response)

      if (!response.ok) {
        throw new Error(json?.COMMON?.message || `HTTP ${response.status}`)
      }

      return json
    } catch (e) {
      if (e?.name === 'AbortError') {
        throw new Error('通信がタイムアウトしました。')
      }

      throw e
    } finally {
      clearTimeout(timer)
      if (loading) stopLoading()
    }
  }

  const unwrap = (json) => {
    if (!json?.COMMON) {
      return null
    }

    if (json.COMMON.code !== 0) {
      notice(json.COMMON.message || 'ファイル処理に失敗しました。', 'error')
      return null
    }

    return json.COMMON.result
  }

  const uploadFile = async (file, params = {}, options = {}) => {
    if (!file) {
      notice('ファイルを選択してください。', 'warning')
      return null
    }

    try {
      const uploadParams = {
        category: params.category || 'default',
        owner_type: params.owner_type || 'common',
        owner_id: params.owner_id || 'none',
        file_kind: params.file_kind || 'default',
      }

      const formData = new FormData()
      formData.append('file', file)

      const json = await access({
        method: 'POST',
        action: 'upload',
        params: uploadParams,
        formData,
        loading: options.loading ?? true,
        loadingText: options.loadingText ?? 'アップロード中です...',
      })

      const result = unwrap(json)

      if (result && options.showSuccessMessage !== false) {
        notice('アップロードしました。', 'success')
      }

      return result
    } catch (e) {
      notice(e.message || 'アップロードに失敗しました。', 'error')
      return null
    }
  }

  const loadFiles = async (params = {}, options = {}) => {
    try {
      const searchParams = {}

      if (typeof params === 'string') {
        searchParams.category = params
      } else {
        if (params.category) searchParams.category = params.category
        if (params.owner_type) searchParams.owner_type = params.owner_type
        if (params.owner_id) searchParams.owner_id = params.owner_id
        if (params.file_kind) searchParams.file_kind = params.file_kind
      }

      const json = await access({
        method: 'GET',
        action: 'list',
        params: searchParams,
        loading: options.loading ?? true,
        loadingText: options.loadingText ?? 'ファイル一覧を取得中です...',
      })

      const result = unwrap(json)
      files.value = Array.isArray(result) ? result : []

      console.log(files.value)

      return files.value
    } catch (e) {
      notice(e.message || 'ファイル一覧の取得に失敗しました。', 'error')
      return null
    }
  }
  
  const getPreviewUrl = async (fileUuid, options = {}) => {
    try {
      const json = await access({
        method: 'GET',
        action: 'preview_url',
        params: {
          file_uuid: fileUuid,
        },
        loading: options.loading ?? true,
        loadingText: options.loadingText ?? 'プレビューURLを作成中です...',
      })

      return unwrap(json)
    } catch (e) {
      notice(e.message || 'プレビューURL取得に失敗しました。', 'error')
      return null
    }
  }

  const previewFile = async (fileUuid, options = {}) => {
    const result = await getPreviewUrl(fileUuid, options)

    if (!result?.url) return null

    window.open(result.url, '_blank')
    return result
  }

  const getDownloadUrl = async (fileUuid, options = {}) => {
    try {
      const json = await access({
        method: 'GET',
        action: 'download_url',
        params: {
          file_uuid: fileUuid,
        },
        loading: options.loading ?? true,
        loadingText: options.loadingText ?? 'ダウンロードURLを作成中です...',
      })

      return unwrap(json)
    } catch (e) {
      notice(e.message || 'ダウンロードURL取得に失敗しました。', 'error')
      return null
    }
  }

  const downloadFile = async (fileUuid, options = {}) => {
    const result = await getDownloadUrl(fileUuid, options)

    if (!result?.url) return null

    window.open(result.url, '_blank')
    return result
  }

  const softDeleteFile = async (fileUuid, options = {}) => {
    try {
      const json = await access({
        method: 'POST',
        action: 'soft_delete',
        params: {
          file_uuid: fileUuid,
        },
        loading: options.loading ?? true,
        loadingText: options.loadingText ?? '削除中です...',
      })

      const result = unwrap(json)

      if (result !== null && options.showSuccessMessage !== false) {
        notice('削除しました。', 'success')
      }

      return true
    } catch (e) {
      notice(e.message || '削除に失敗しました。', 'error')
      return null
    }
  }

  const deleteFile = async (fileUuid, options = {}) => {
    try {
      const json = await access({
        method: 'POST',
        action: 'delete',
        params: {
          file_uuid: fileUuid,
        },
        loading: options.loading ?? true,
        loadingText: options.loadingText ?? '完全削除中です...',
      })

      const result = unwrap(json)

      if (result !== null && options.showSuccessMessage !== false) {
        notice('完全削除しました。', 'success')
      }

      return true
    } catch (e) {
      notice(e.message || '完全削除に失敗しました。', 'error')
      return null
    }
  }

  return {
    files,
    currentFile,

    commonConstants,
    commonParams,

    notice,
    startLoading,
    stopLoading,

    uploadFile,
    loadFiles,
    getPreviewUrl,
    previewFile,
    getDownloadUrl,
    downloadFile,
    softDeleteFile,
    deleteFile,
  }
})


/**
 * File Store
 * 
import { useFileStore } from '@/stores/useFileStore'

const fileStore = useFileStore()

await fileStore.uploadFile(file, 'staff/profile')
await fileStore.loadFiles('staff/profile')

await fileStore.previewFile(fileUuid)
await fileStore.downloadFile(fileUuid)
await fileStore.softDeleteFile(fileUuid)


fileStore.uploadFile(file, category)
fileStore.loadFiles(category)
fileStore.previewFile(fileUuid)
fileStore.downloadFile(fileUuid)
fileStore.softDeleteFile(fileUuid)

 * 
 * 
 */