// stores/useDbStore.js
import { defineStore } from 'pinia'
import { reactive, } from 'vue'
import { showSnackbar } from '@/utils/SnackBar.vue'
import { showLoading, hideLoading } from '@/utils/loadingService'

/**
 * useDbStore
 * DBConnectionStore + BaseStore を統合した正式 Store。
 * BaseStore.js は廃止する。
 *
 * 維持する既存互換:
 *  - dbAccess(sqltag, params, options, SQL_PATH, URL)
 *  - dbAccessWithMultiTags(params, options, SQL_PATH, URL)
 *  - executeMultiQuery / excecuteMultiQuery typo 互換
 *  - login / verify / logout
 *  - LOOP は params の中にそのまま渡す
 *  - Vite / WebComponent 両方で tenant URL を解決
 *
 * 通知・ローディング:
 *  - showSnackbar を直接使用
 *  - showLoading / hideLoading を直接使用
 */
export const useDbStore = defineStore('dbStore', () => {
  // const RETURN = 1
  // const RESULT_TYPE = 1
  // const QUERY_TYPE = 2
  const DEFAULT_RETURN = 1
  const DEFAULT_RESULT_TYPE = 1
  const DEFAULT_QUERY_TYPE = 2
  const DEFAULT_TID = 'premier'
  const DEFAULT_SQL_PATH = 'showcase/entrance.sql'

  // const tenantId = computed(() => detectTid() || DEFAULT_TID)

  const commonConstants = reactive({
    TRANSACTION_URL: '/dataEngine/v5/handleRequest/requestHandler.php',
    LOGIN_URL: '/dataEngine/v5/handleRequest/login.php',
    LOGOUT_URL: '/dataEngine/v5/handleRequest/logout.php',
    VERIFY_URL: '/dataEngine/v5/handleRequest/verify.php',
  })

  const commonParams = reactive({
    RETURN: DEFAULT_RETURN,
    RESULT_TYPE: DEFAULT_RESULT_TYPE,
    QUERY_TYPE: DEFAULT_QUERY_TYPE,
    // SQL_PATH: `${tenantId.value}/${DEFAULT_SQL_PATH}`,
    SQL_PATH: '',
    tid: DEFAULT_TID,
  })

  const notice = (message, level = 'info') => {
    try {
      showSnackbar(message, level)
    } catch (e) {
      console.warn('[useDbStore] showSnackbar failed:', e)
    }
  }

  const startLoading = (message = '処理中です...') => {
    try {
      showLoading(message)
    } catch (e) {
      console.warn('[useDbStore] showLoading failed:', e)
    }
  }

  const stopLoading = () => {
    try {
      hideLoading()
    } catch (e) {
      console.warn('[useDbStore] hideLoading failed:', e)
    }
  }

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token') || ''

  const saveToken = (token, persist = false) => {
    if (!token) return
    sessionStorage.setItem('token', token)
    if (persist) localStorage.setItem('token', token)
  }

  const clearToken = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
  }

  // const joinPath = (a = '', b = '') => `${String(a).replace(/\/+$/, '')}/${String(b).replace(/^\/+/, '')}`
  function detectTid() {
    if (typeof window === 'undefined') return commonParams.tid

    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return commonParams.tid
    }

    const segs = window.location.pathname.split('/').filter(Boolean)
    return segs[0] || commonParams.tid
  }

  const makeCommon = (SQL_PATH = null) => {
    const tid = detectTid()
    commonParams.tid = tid

    return {
      ...commonParams,
      tid,
      SQL_PATH: SQL_PATH || `${tid}/${DEFAULT_SQL_PATH}`,
    }
  }

  const buildUrl = (endpoint) => {
    const tid = detectTid()
    const ep = String(endpoint).replace(/^\/+/, '')
    return `/${tid}/${ep}`
  }

  const parseResponseText = (text) => {
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch (e) {
      return { code: 500, message: text, raw: text }
    }
  }

  const access = async (
    url,
    jsonBody,
    {
      requireAuth = true,
      timeoutMs = 30000,
      loading = true,
      loadingText = '処理中です...',
    } = {},
  ) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    if (loading) startLoading(loadingText)

    try {
      const headers = { 'Content-Type': 'application/json' }

      if (requireAuth) {
        const token = getToken()
        if (!token) throw new Error('Authorization Bearer token is missing.')
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(jsonBody ?? {}),
        signal: controller.signal,
      })

      const text = await response.text()
      const data = parseResponseText(text)

      if (!response.ok || data?.message === 'JWT has expired.') {
        const message = data?.message || `HTTP ${response.status}`

        if (
          message.includes('JWT has expired') ||
          message.includes('Authorization Bearer token is missing') ||
          message.includes('Invalid JWT')
        ) {
          clearToken()

          notice('ログイン期限が切れました。再ログインしてください。', 'warning')

          window.dispatchEvent(new CustomEvent('surupas:auth-expired', {
            detail: { message }
          }))

          throw new Error('AUTH_EXPIRED')
        }

        throw new Error(message)
      }

      return data
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

  const normalizeSqlParams = (sqltag, params = {}) => ({
    SQL_TAG: params.SQL_TAG || params.SQLTAG || sqltag,
    ...params,
  })
  
  const dbAccess = async (sqltag, params = {}, options = {}, SQL_PATH = null, URL = null) => {
    const payload = {
      COMMON: makeCommon(SQL_PATH),
      [sqltag]: normalizeSqlParams(sqltag, params),
    }

    const resp = await access(
      buildUrl(URL || commonConstants.TRANSACTION_URL),
      { json_string: payload },
      {
        requireAuth: options.requireAuth ?? true,
        loading: options.loading ?? true,
        loadingText: options.loadingText ?? '処理中です...',
        timeoutMs: options.timeoutMs ?? 30000,
      },
    )

    options.onSuccess?.(resp)
    return resp
  }

  const unwrapMultiTagResult = (resp) => {
    const result = resp?.result || {}
    const data = {}


    Object.keys(result).forEach((key) => {
      console.log(`Unwrapping result for tag: ${key}`, result[key])
      data[key] = result[key]?.result || []
    })

    return data
  }

  const dbAccessWithMultiTags = async (params = {}, options = {}, SQL_PATH = null, URL = null) => {
    const payload = {
      COMMON: makeCommon(SQL_PATH),
      ...params,
    }

    Object.keys(payload).forEach((key) => {
      if (key !== 'COMMON' && payload[key] && typeof payload[key] === 'object') {
        payload[key] = normalizeSqlParams(key, payload[key])
      }
    })

    const resp = await access(
      buildUrl(URL || commonConstants.TRANSACTION_URL),
      { json_string: payload },
      {
        requireAuth: options.requireAuth ?? true,
        loading: options.loading ?? true,
        loadingText: options.loadingText ?? '処理中です...',
        timeoutMs: options.timeoutMs ?? 30000,
      },
    )

    options.onSuccess?.(resp)

    return {
      ...resp,
      data: unwrapMultiTagResult(resp),
    }
  }

  const login = async (sqltag, params = {}, options = {}, SQL_PATH = null) => {
    if (typeof sqltag !== 'string') {
      throw new Error('login(sqltag, params): sqltag must be string')
    }

    const payload = {
      COMMON: makeCommon(SQL_PATH),
      [sqltag]: normalizeSqlParams(sqltag, params),
    }

    const resp = await access(
      buildUrl(commonConstants.LOGIN_URL),
      { json_string: payload },
      {
        requireAuth: false,
        loading: options.loading ?? true,
        loadingText: options.loadingText ?? 'ログイン中です...',
        timeoutMs: options.timeoutMs ?? 30000,
      },
    )

    if (resp?.token) saveToken(resp.token, !!options.persist)
    options.onSuccess?.(resp)
    return resp
  }

  const verify = async (options = {}) => {
    try {
      if (!getToken()) return false
      const resp = await access(
        buildUrl(commonConstants.VERIFY_URL),
        {},
        {
          requireAuth: true,
          loading: options.loading ?? false,
          timeoutMs: options.timeoutMs ?? 30000,
        },
      )
      return !!resp?.verified || resp?.code === 0
    } catch (_) {
      return false
    }
  }

  const logout = async (options = {}) => {
    try {
      await access(
        buildUrl(commonConstants.LOGOUT_URL),
        {},
        {
          requireAuth: false,
          loading: options.loading ?? true,
          loadingText: options.loadingText ?? 'ログアウト中です...',
          timeoutMs: options.timeoutMs ?? 30000,
        },
      )
    } catch (_) {
      // logout は token 削除を優先
    } finally {
      clearToken()
    }
  }

  const load = async (sqltag, param = {}, options = {}) => {
    try {
      const resp = await dbAccess(sqltag, param, options)
      const r = resp?.result?.[sqltag]

      if (resp?.code !== 0 || !r || r.code !== 0) {
        notice('データ取得にエラーが発生しました。', 'error')
        return null
      }

      if (!r.result || r.result.length === 0) {
        if (options.showNoDataMessage !== false) {
          notice('条件に当てはまるデータはありませんでした。', 'warning')
        }
        return null
      }

      return r.result
    } catch (e) {
      notice(e.message || 'エラーが発生しました。', 'error')
      return null
    }
  }

  const execute = async (sqltag, params = {}, options = {}) => {
    try {
      const resp = await dbAccess(sqltag, params, options)
      const r = resp?.result?.[sqltag]
      const arr = Array.isArray(r) ? r : [r].filter(Boolean)

      if (resp?.code !== 0 || arr.some((x) => x?.code !== 0)) {
        notice('データ処理にエラーが発生しました。', 'error')
        return null
      }

      if (options.showSuccessMessage !== false) {
        notice('データ処理をしました。', 'success')
      }

      return true
    } catch (e) {
      notice(e.message || 'エラーが発生しました。', 'error')
      return null
    }
  }

  const executeMultiQuery = async (params = {}, options = {}) => {
    try {
      const resp = await dbAccessWithMultiTags(params, options)

      if (resp?.code !== 0) {
        notice('データ取得にエラーが発生しました。', 'error')
        return null
      }

      return resp.result
    } catch (e) {
      notice(e.message || 'エラーが発生しました。', 'error')
      return null
    }
  }

  // 既存 typo 互換。将来的には executeMultiQuery に統一。
  const excecuteMultiQuery = executeMultiQuery
  const save = execute

  // const setTenantId = (tid) => { if (tid) commonParams.tid = String(tid) }
  // const setSQLPath = (sqlPath) => { commonParams.SQL_PATH = sqlPath || '' }
  const uniqueId = (prefix = '') => `${prefix}${prefix ? '_' : ''}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // init()

  return {
    commonConstants,
    commonParams,
    // init,

    // direct utility
    notice,
    startLoading,
    stopLoading,

    // token
    getToken,
    saveToken,
    clearToken,

    // config
    // setTenantId,
    // setSQLPath,

    // DB core
    dbAccess,
    dbAccessWithMultiTags,

    // auth
    login,
    verify,
    logout,

    // high-level helpers
    load,
    execute,
    save,
    executeMultiQuery,
    excecuteMultiQuery,
    uniqueId,
  }
})