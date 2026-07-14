import { useDataStore } from '@/stores/DataStore'

export function useFormCrud() {
  const dataStore = useDataStore()

  const removeSystemFields = row => {
    const copied = { ...row }
    delete copied.__uuid
    return copied
  }

  const buildSingleParams = (row = {}, commonParams = {}) => {
    const clean = removeSystemFields(row)

    return {
      ...commonParams,
      ...clean,
      profile_jsonb: JSON.stringify(clean || {}),
      files: JSON.stringify(clean.files || []),
      profile_version: clean.profile_version || 1,
      staff_code: clean.staff_code || commonParams.staff_code || '',
      staff_id: clean.staff_id || commonParams.staff_id || '',
    }
  }

  const buildLoopParams = (rows = [], commonParams = {}) => {
    return {
      LOOP: rows.map(row => buildSingleParams(row, commonParams))
    }
  }

  const saveSingle = async ({ sqltags, row, commonParams = {} }) => {
    return await dataStore.saveData(
      sqltags.save,
      buildSingleParams(row, commonParams)
    )
  }

  const saveLoop = async ({ sqltags, rows, commonParams = {} }) => {
    return await dataStore.saveData(
      sqltags.save,
      buildLoopParams(rows, commonParams)
    )
  }

  const removeOne = async ({ sqltags, row, commonParams = {} }) => {
    return await dataStore.saveData(sqltags.delete, {
      ...commonParams,
      ...row,
      enabled: 'inactive',
    })
  }

  return {
    saveSingle,
    saveLoop,
    removeOne,
    buildSingleParams,
    buildLoopParams,
  }
}
