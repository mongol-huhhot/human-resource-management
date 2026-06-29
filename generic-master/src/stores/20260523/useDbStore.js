// src/stores/useDbStore.js
import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import { showSnackbar } from '@/utils/SnackBar.vue'
import { showLoading, hideLoading } from '@/utils/loadingService'

export const useDbStore = defineStore('dbStore', () => {
  const DEFAULT_RETURN = 1
  const DEFAULT_RESULT_TYPE = 1
  const DEFAULT_QUERY_TYPE = 2
  const DEFAULT_SQL_PATH = 'showcase/entrance.sql'

  const tenantId = computed(() => {
    const tid = window.location.pathname.split('/').filter(Boolean)[0]
    if (tid) return tid
    if (location.hostname === 'localhost') return 'showcase'
    return ''
  })

  const common = reactive({
    tid: tenantId.value,
    RETURN: DEFAULT_RETURN,
    RESULT_TYPE: DEFAULT_RESULT_TYPE,
    QUERY_TYPE: DEFAULT_QUERY_TYPE,
    SQL_PATH: `${tenantId.value}/${DEFAULT_SQL_PATH}`,
  })

  const urls = reactive({
    DATABASE_ENGINE_URL: `/dataEngine/v3/databaseEngine.php`,
    LOAD_IMAGE_URL: `/dataEngine/v3/loadImage.php`,
  })

  function getApiUrl(path = urls.DATABASE_ENGINE_URL) {
    return `/${common.tid}${path}`
  }

  function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
  }

  function setToken(token, remember = true) {
    if (!token) return

    if (remember) {
      localStorage.setItem('token', token)
      sessionStorage.removeItem('token')
    } else {
      sessionStorage.setItem('token', token)
      localStorage.removeItem('token')
    }
  }

  function clearToken() {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
  }

  function buildRequest(blocks = {}, options = {}) {
    return {
      COMMON: {
        ...common,
        ...(options.COMMON || {}),
      },
      ...blocks,
    }
  }

  async function postJson(json, options = {}) {
    const loading =
      options.showLoading === false
        ? null
        : showLoading(options.loadingText || '通信中です...')

    try {
      const headers = {
        'Content-Type': 'application/json',
      }

      const token = getToken()

      if (options.auth !== false && token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(getApiUrl(options.url), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          json_string: JSON.stringify(json),
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.COMMON?.message || `HTTP Error: ${response.status}`)
      }

      return data
    } finally {
      loading?.close()
    }
  }

  async function query(sqlTag, params = {}, options = {}) {
    if (!sqlTag) return null

    const json = buildRequest({
      [sqlTag]: {
        SQL_TAG: sqlTag,
        SQL_PATH: params.SQL_PATH || common.SQL_PATH,
        RETURN: params.RETURN ?? DEFAULT_RETURN,
        ...params,
      },
    }, options)

    return await postJson(json, options)
  }
  /* =======================================================================
   | ここから下は、プロジェクト固有のロジックを記述する場所です。 |
   | 共通的なDBアクセスロジックは上部に実装されているqueryやpostJsonを利用して実装してください。|
   | 例）get_user_masterやget_item_categoryなどの関数をここに実装します。|
   =========================================== 
     * @param {*} params: {
   *                      'load_user': {'SQLTAG': 'load_user','userid': ''},
   *                      'load_department': {'SQLTAG': 'load_department'} 
   *                    }
   * */
  async function multiQuery(blocks = {}, options = {}) {
    const json = buildRequest(blocks, options)
    return await postJson(json, options)
  }

  function getSqlResult(response, sqlTag) {
    const result = response?.[sqlTag]
    if (Array.isArray(result)) return result[0] || null
    return result || null
  }

  function getRowsFromResult(result) {
    if (!result) return []
    if (Array.isArray(result.result)) return result.result
    if (result.result == null) return []
    return [result.result]
  }

  async function load(sqlTag, params = {}, options = {}) {
    try {
      const response = await query(sqlTag, params, {
        loadingText: options.loadingText || 'データ取得中です...',
        ...options,
      })

      if (response?.COMMON?.code !== 0) {
        showSnackbar(response?.COMMON?.message || 'データ取得に失敗しました。', 'error')
        return null
      }

      const result = getSqlResult(response, sqlTag)

      if (!result || result.code !== 0) {
        showSnackbar(result?.message || 'データ取得に失敗しました。', 'error')
        return null
      }

      const rows = getRowsFromResult(result)

      if (rows.length === 0 && options.showNoDataMessage !== false) {
        showSnackbar('条件に当てはまるデータはありませんでした。', 'warning')
      }

      return rows
    } catch (error) {
      console.error(error)
      showSnackbar(error.message || 'エラーが発生しました。', 'error')
      return null
    }
  }

  async function execute(sqlTag, params = {}, options = {}) {
    try {
      const response = await query(sqlTag, params, {
        loadingText: options.loadingText || 'データ処理中です...',
        ...options,
      })

      if (response?.COMMON?.code !== 0) {
        showSnackbar(response?.COMMON?.message || 'データ処理に失敗しました。', 'error')
        return false
      }

      const result = getSqlResult(response, sqlTag)

      if (!result || result.code !== 0) {
        showSnackbar(result?.message || 'データ処理に失敗しました。', 'error')
        return false
      }

      if (options.showSuccess !== false) {
        showSnackbar(options.successMessage || 'データ処理をしました。', 'success')
      }

      return true
    } catch (error) {
      console.error(error)
      showSnackbar(error.message || 'エラーが発生しました。', 'error')
      return false
    }
  }

  async function runLoad(sqlTag, params = {}, targetKey = null, options = {}) {
    const rows = await load(sqlTag, params, options)
    if (targetKey) return { [targetKey]: rows }
    return rows
  }

  async function runSave(sqlTag, params = {}, options = {}) {
    return await execute(sqlTag, params, options)
  }

  async function dbAccessWithMultiTags(blocks = {}, options = {}) {
    const response = await multiQuery(blocks, {
      loadingText: options.loadingText || 'データ取得中です...',
      ...options,
    })

    if (response?.COMMON?.code !== 0) {
      return {
        code: response?.COMMON?.code ?? -1,
        message: response?.COMMON?.message || 'データ取得に失敗しました。',
        result: null,
        raw: response,
      }
    }

    const result = {}

    for (const key of Object.keys(blocks)) {
      const item = response?.[key]
      const sqlResult = Array.isArray(item) ? item[0] : item

      if (!sqlResult || sqlResult.code !== 0) {
        return {
          code: sqlResult?.code ?? -1,
          message: sqlResult?.message || `${key} の取得に失敗しました。`,
          result: null,
          raw: response,
        }
      }

      result[key] = sqlResult
    }

    return {
      code: 0,
      message: 'success',
      result,
      raw: response,
    }
  }

  const save = runSave

  async function login(params = {}, options = {}) {
    console.log('Login params:', params)
    const response = await query('authenticate.login', params, {
      ...options,
      auth: false,
      loadingText: options.loadingText || 'ログイン中です...',
      COMMON: {
        AUTH_REQUIRED: '0',
        ...(options.COMMON || {}),
      },
    })

    console.log('Login response:', response)

    const result = getSqlResult(response, 'authenticate.login')
    console.log('111111 Login result:', result)
    if (!result || result.code !== 0) {
      showSnackbar(result?.message || 'ログインに失敗しました。', 'error')
      return null
    }

    const token =
      result?.token ||
      result?.result?.[0]?.token ||
      response?.COMMON?.token

    console.log('Extracted token:', token)
    console.log('Login options:', options)
    if (token) {
      setToken(token, options.remember ?? true)
    }

    return response
  }

  async function registerUser(sqlTag, params = {}, options = {}) {
    return await query(sqlTag, params, {
      ...options,
      auth: false,
      loadingText: options.loadingText || 'ユーザー登録中です...',
      COMMON: {
        AUTH_REQUIRED: '0',
        TRANSACTION: '1',
        ...(options.COMMON || {}),
      },
    })
  }

  async function verify(options = {}) {
    try {
      const token = getToken()
      if (!token) return false

      const response = await postJson(
        buildRequest({
          verify_token: {
            SQL_TAG: 'verify_token',
            RETURN: 1,
          },
        }, {
          COMMON: {
            AUTH_REQUIRED: '1',
            ...(options.COMMON || {}),
          },
        }),
        {
          ...options,
          auth: true,
          showLoading: options.showLoading ?? false,
        }
      )

      return response?.COMMON?.code === 0
    } catch (error) {
      console.error(error)
      return false
    }
  }

  async function logout() {
    clearToken()
    hideLoading()
    return true
  }

  return {
    common,
    urls,

    getToken,
    setToken,
    clearToken,

    showLoading,
    hideLoading,

    query,
    multiQuery,
    dbAccessWithMultiTags,
    load,
    execute,
    save,
    runLoad,
    runSave,

    login,
    registerUser,
    verify,
    logout,
  }
})