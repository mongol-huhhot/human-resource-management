export const ruleFactory = {
  required: (rule = {}) => {
    return v => {
      if (v === null || v === undefined || v === '') {
        return rule.message || '必須です'
      }

      if (Array.isArray(v) && v.length === 0) {
        return rule.message || '必須です'
      }

      return true
    }
  },

  email: (rule = {}) => {
    return v => {
      if (!v) return true
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        || rule.message
        || 'メール形式が不正です'
    }
  },

  minLength: (rule = {}) => {
    return v => {
      if (!v) return true
      return String(v).length >= rule.value
        || rule.message
        || `${rule.value}文字以上です`
    }
  },

  maxLength: (rule = {}) => {
    return v => {
      if (!v) return true
      return String(v).length <= rule.value
        || rule.message
        || `${rule.value}文字以内です`
    }
  },

  min: (rule = {}) => {
    return v => {
      if (v === null || v === undefined || v === '') return true
      return Number(v) >= rule.value
        || rule.message
        || `${rule.value}以上です`
    }
  },

  max: (rule = {}) => {
    return v => {
      if (v === null || v === undefined || v === '') return true
      return Number(v) <= rule.value
        || rule.message
        || `${rule.value}以下です`
    }
  },

  pattern: (rule = {}) => {
    return v => {
      if (!v) return true

      const regex = new RegExp(rule.value)

      return regex.test(v)
        || rule.message
        || '入力形式が正しくありません'
    }
  }
}

export function buildRules(field) {
  if (!field.rules) return []

  return field.rules
    .filter(rule => ruleFactory[rule.type])
    .map(rule => ruleFactory[rule.type](rule))
}

/*
<v-text-field
  v-model="form[field.key]"
  :label="field.label"
  :type="field.props?.type || 'text'"
  :clearable="field.props?.clearable"
  :autocomplete="field.props?.autocomplete"
  :placeholder="field.placeholder"
  :readonly="field.readonly"
  :rules="buildRules(field)"
/>
*/