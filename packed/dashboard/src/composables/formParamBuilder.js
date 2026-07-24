// src/composables/formParamBuilder.js

export function removeSystemFields(data) {
  if (Array.isArray(data)) {
    return data.map(item => removeSystemFields(item))
  }

  const copied = { ...data }
  delete copied.__uuid

  return copied
}

export function omitKeys(data, keys = []) {

  if (Array.isArray(data)) {
    return data.map(item => omitKeys(item, keys))
  }

  const copied = { ...data }

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