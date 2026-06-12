// src/composables/formParamBuilder.js

export function removeSystemFields(row = {}) {
  const copied = { ...row }

  delete copied.__uuid

  return copied
}

export function omitKeys(obj = {}, keys = []) {
  const copied = { ...obj }

  keys.forEach(key => {
    delete copied[key]
  })

  return copied
}

/**
 * tabConfig example
 *
 * {
 *   jsonb_fields: ['profile_jsonb'],
 *   separate_items: ['staff_code', 'profile_version']
 * }
 */
export function buildSaveParams(
  row = {},
  tabConfig = {},
  commonParams = {}
) {
  const cleanRow = removeSystemFields(row)

  const jsonbFields = tabConfig?.jsonb_fields || []
  const separateItems = tabConfig?.separate_items || []

  const params = {
    ...commonParams,
  }

  // JSONB利用時
  if (jsonbFields.length > 0) {

    // separate_items を通常カラムとして保存
    separateItems.forEach(key => {
      params[key] =
        cleanRow[key] ??
        commonParams[key] ??
        null
    })

    // JSONB対象データ
    const jsonData = omitKeys(
      cleanRow,
      separateItems
    )

    // 1タブ1JSONB
    const jsonbColumn = jsonbFields[0]

    params[jsonbColumn] =
      JSON.stringify(jsonData || {})

    return params
  }

  // JSONBなし
  return {
    ...params,
    ...cleanRow,
  }
}

/**
 * LOOP保存用
 */
export function buildLoopParams(
  rows = [],
  tabConfig = {},
  commonParams = {}
) {
  return {
    LOOP: rows.map(row =>
      buildSaveParams(
        row,
        tabConfig,
        commonParams
      )
    ),
  }
}

// -----------------------------------------------------------------------------
// デフォルト日付値の'now','today'の変換。実際必要であれば、index.jsの"condition"の日付の値を直接：new Date().toISOString().slice(0, 10)などにしてもいいです
function getDefaultValue(value) {
  if (value === "today") {
    return new Date().toISOString().slice(0, 10)
  }

  if (value === "now") {
    return new Date().toISOString()
  }

  return value
}

// null などをフィルターアウトする
function cleanObject(obj = {}) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  )
}

function filteredValueExists(value) {
  return value !== undefined && value !== null && value !== ''
}

/**
 * 優先順位:
 * commonParams < uiCondition < selectedRow
 *
 * 最後に condition に存在する項目だけ残す
 */
export function mergeConditionParams({
  condition = {},
  propertyParams = {},
  uiCondition = {},
  runTimeParams = {},
  optionParams = {},
}) {
  const allowedKeys = Object.keys(condition)

  const initialParams = {}

  for (const key of allowedKeys) {
    initialParams[key] = getDefaultValue(condition[key])
  }

  const merged = {
    ...initialParams,
    ...propertyParams,
    ...uiCondition,
    ...runTimeParams,
    ...optionParams,
  }

  const filtered = {}

  for (const key of allowedKeys) {
    if (filteredValueExists(merged[key])) {
      filtered[key] = merged[key]
    }
  }

  return cleanObject(filtered)
}

