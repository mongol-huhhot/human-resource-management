// utilFactory.js
export const parseJsonbFields = (rows = [], keys = []) => {
  return rows.map(row => {
    const newRow = { ...row }
    keys.forEach(key => {
      try {
        if (typeof row[key] === 'string' && row[key].trim() !== '') {
          newRow[key] = JSON.parse(row[key])
        }
      } catch (e) {
        newRow[key] = null
      }
    })
    return newRow
  })
}


export const parseAndFlattenJsonbFields = (
  rows = [],
  keys = []
) => {
  return rows.map(row => {
    let jsonValues = {}

    keys.forEach(key => {
      try {
        let parsed = row[key]

        if (
          typeof parsed === 'string' &&
          parsed.trim() !== ''
        ) {
          parsed = JSON.parse(parsed)
        }

        if (
          parsed &&
          typeof parsed === 'object' &&
          !Array.isArray(parsed)
        ) {
          jsonValues = {
            ...jsonValues,
            ...parsed
          }
        }
      } catch (e) {
        console.error(`JSON parse failed: ${key}`, e)
      }
    })

    const newRow = {
      ...jsonValues, // jsonb 側
      ...row         // 既存 flat カラム側を優先
    }

    keys.forEach(key => {
      delete newRow[key]
    })

    return newRow
  })
}

export const parseRepeatableJsonbFields = (
  rows = [],
  keys = []
) => {
  if (!rows.length) return []

  const row = rows[0]

  for (const key of keys) {
    try {
      let parsed = row[key]

      if (
        typeof parsed === "string" &&
        parsed.trim() !== ""
      ) {
        parsed = JSON.parse(parsed)
      }

      if (Array.isArray(parsed)) {
        return parsed
      }

    } catch (e) {
      console.error(`JSON parse failed: ${key}`, e)
    }
  }

  return []
}
