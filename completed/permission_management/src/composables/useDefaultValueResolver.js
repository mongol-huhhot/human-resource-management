// src/composables/useDefaultValueResolver.js

export function useDefaultValueResolver() {
  function formatDate(date) {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  function resolveDefaultValue(defaultValue, context = {}) {
    if (defaultValue === undefined || defaultValue === null) {
      return defaultValue
    }

    if (defaultValue === 'today') {
      return formatDate(new Date())
    }

    if (defaultValue === 'now') {
      return new Date().toISOString()
    }

    if (defaultValue === 'first_day_of_month') {
      const d = new Date()
      return formatDate(new Date(d.getFullYear(), d.getMonth(), 1))
    }

    if (defaultValue === 'last_day_of_month') {
      const d = new Date()
      return formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 0))
    }

    if (typeof defaultValue === 'string') {
      return defaultValue.replace(/<%(.+?)%>/g, (_, key) => {
        return context[key] ?? ''
      })
    }

    return defaultValue
  }

  function applyDefaultValues(formData, fields = [], context = {}) {
    const next = { ...(formData || {}) }

    for (const field of fields) {
      const key = field.key || field.l_item_code

      if (!key) continue

      if (
        (next[key] === undefined || next[key] === null || next[key] === '') &&
        field.default !== undefined
      ) {
        next[key] = resolveDefaultValue(field.default, context)
      }
    }

    return next
  }

  return {
    resolveDefaultValue,
    applyDefaultValues,
  }
}
