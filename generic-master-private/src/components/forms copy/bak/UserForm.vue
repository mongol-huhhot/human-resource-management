<!-- UserForm.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  fields: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const formData = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

function updateField(key, value) {
  formData.value = {
    ...formData.value,
    [key]: value,
  }
}

function buildRules(field) {
  const rules = []
  const v = field.validation || {}

  if (field.required || v.required) {
    rules.push(value => !!value || `${field.label}は必須です`)
  }

  if (v.minLength) {
    rules.push(value =>
      !value || value.length >= v.minLength || `${field.label}は${v.minLength}文字以上です`
    )
  }

  if (v.maxLength) {
    rules.push(value =>
      !value || value.length <= v.maxLength || `${field.label}は${v.maxLength}文字以内です`
    )
  }

  if (v.email) {
    rules.push(value =>
      !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'メールアドレス形式が正しくありません'
    )
  }

  if (v.pattern) {
    const reg = new RegExp(v.pattern)
    rules.push(value =>
      !value || reg.test(value) || v.message || `${field.label}の形式が正しくありません`
    )
  }

  return rules
}

function getComponent(field) {
  return field.component || 'v-text-field'
}

function getProps(field) {
  return {
    label: field.label,
    placeholder: field.placeholder,
    readonly: field.readonly,
    required: field.required,
    clearable: true,
    ...field.props,
  }
}

function submit() {
  emit('submit', formData.value)
}
</script>

<template>
  <v-form @submit.prevent="submit">
    <v-row>
      <v-col
        v-for="field in fields"
        :key="field.key"
        cols="12"
        md="6"
      >
        <component
          :is="getComponent(field)"
          :model-value="formData[field.key]"
          v-bind="getProps(field)"
          :items="field.items || []"
          :item-title="field.props?.itemTitle || 'label'"
          :item-value="field.props?.itemValue || 'value'"
          :rules="buildRules(field)"
          @update:model-value="value => updateField(field.key, value)"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" class="text-right">
        <v-btn color="primary" type="submit">
          保存
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<!--
<script setup>
import { ref } from 'vue'
import UserForm from './UserForm.vue'

const userData = ref({
  user_id: '',
  user_name: '',
  email: '',
  password: '',
  gender: '',
})

const fields = ref([
  field_user_id,
  field_user_name,
  field_email,
  field_password,
  field_gender,
])

function saveUser(data) {
  console.log('保存データ:', data)
}
</script>

<template>
  <UserForm
    v-model="userData"
    :fields="fields"
    @submit="saveUser"
  />
</template>

-->