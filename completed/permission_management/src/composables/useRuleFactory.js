// useRuleFactory.js
// src/composables/useRuleFactory.js

export const useRuleFactory = {
  required: (rule = {}, field = {}) => {
    return v => {
      if (v === null || v === undefined || v === '') {
        return rule.message || `${field.label || ''}は必須です`
      }

      if (Array.isArray(v) && v.length === 0) {
        return rule.message || `${field.label || ''}は必須です`
      }

      return true
    }
  },

  email: (rule = {}, field = {}) => {
    return v => {
      if (!v) return true

      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        || rule.message
        || 'メールアドレス形式が正しくありません'
    }
  },

  minLength: (rule = {}, field = {}) => {
    return v => {
      if (!v) return true

      return String(v).length >= rule.value
        || rule.message
        || `${field.label || ''}は${rule.value}文字以上です`
    }
  },

  maxLength: (rule = {}, field = {}) => {
    return v => {
      if (!v) return true

      return String(v).length <= rule.value
        || rule.message
        || `${field.label || ''}は${rule.value}文字以内です`
    }
  },

  min: (rule = {}, field = {}) => {
    return v => {
      if (v === null || v === undefined || v === '') return true

      return Number(v) >= rule.value
        || rule.message
        || `${field.label || ''}は${rule.value}以上です`
    }
  },

  max: (rule = {}, field = {}) => {
    return v => {
      if (v === null || v === undefined || v === '') return true

      return Number(v) <= rule.value
        || rule.message
        || `${field.label || ''}は${rule.value}以下です`
    }
  },

  pattern: (rule = {}, field = {}) => {
    return v => {
      if (!v) return true

      const regex = new RegExp(rule.value)

      return regex.test(v)
        || rule.message
        || `${field.label || '入力値'}の形式が正しくありません`
    }
  },
}

// rule or validationの場合はこちらに追加
function normalizeValidationToRules(field = {}) {
  const validation = field.validation || field.rule || {}
  const rules = []

  if (field.required || validation.required) {
    rules.push({
      type: 'required',
      message:
        validation.requiredMessage ||
        validation.message,
    })
  }

  if (validation.email || field.type === 'email') {
    rules.push({
      type: 'email',
      message: validation.emailMessage,
    })
  }

  if (validation.minLength) {
    rules.push({
      type: 'minLength',
      value: validation.minLength,
      message: validation.minLengthMessage,
    })
  }

  if (validation.maxLength) {
    rules.push({
      type: 'maxLength',
      value: validation.maxLength,
      message: validation.maxLengthMessage,
    })
  }

  if (validation.min !== undefined) {
    rules.push({
      type: 'min',
      value: validation.min,
      message: validation.minMessage,
    })
  }

  if (validation.max !== undefined) {
    rules.push({
      type: 'max',
      value: validation.max,
      message: validation.maxMessage,
    })
  }

  if (validation.pattern) {
    rules.push({
      type: 'pattern',
      value: validation.pattern,
      message: validation.message || validation.patternMessage,
    })
  }

  return rules
}

export function buildRules(field = {}) {
  const normalizedRules = normalizeValidationToRules(field)

  const explicitRules = Array.isArray(field.rules)
    ? field.rules
    : []

  return [
    ...normalizedRules,
    ...explicitRules,
  ]
    .filter(rule => rule?.type && useRuleFactory[rule.type])
    .map(rule => useRuleFactory[rule.type](rule, field))
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

