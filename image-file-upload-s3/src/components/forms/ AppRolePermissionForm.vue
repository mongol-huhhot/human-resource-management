<!-- AppRolePermissionForm.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },

  disabled: {
    type: Boolean,
    default: false,
  },

  showSubmit: {
    type: Boolean,
    default: true,
  },

  appItems: {
    type: Array,
    default: () => [
      { label: 'SURUPAs', value: 'surupas' },
      { label: 'Work Report', value: 'work_report' },
    ],
  },

  roleItems: {
    type: Array,
    default: () => [
      { label: 'システム管理者', value: 'system_admin' },
      { label: '人事管理者', value: 'hr_admin' },
      { label: '勤怠管理者', value: 'attendance_admin' },
      { label: '契約管理者', value: 'contract_admin' },
      { label: '社員', value: 'employee' },
      { label: 'スタッフ', value: 'staff' },
      { label: '管理者', value: 'admin' },
    ],
  },

  processItems: {
    type: Array,
    default: () => [
      { label: '全機能', value: '*' },
      { label: 'スタッフ情報', value: 'staff_profile' },
      { label: '勤怠', value: 'attendance' },
      { label: '契約', value: 'contract' },
      { label: 'デフォルト', value: 'default' },
      { label: '承認済み', value: 'approved' },
    ],
  },

  actionItems: {
    type: Array,
    default: () => [
      { label: '作成', value: 'create' },
      { label: '更新', value: 'update' },
      { label: '保存', value: 'save' },
      { label: '申請', value: 'apply' },
      { label: '承認', value: 'approve' },
      { label: '却下', value: 'reject' },
      { label: '修正', value: 'correct' },
      { label: '帳票', value: 'report' },
      { label: '印刷', value: 'print' },
      { label: 'PDF出力', value: 'export_pdf' },
    ],
  },

  fieldItems: {
    type: Array,
    default: () => [
      { label: '承認状態', value: 'approval_status' },
      { label: '承認者', value: 'approved_by' },
      { label: '承認日時', value: 'approved_at' },
      { label: 'スタッフコード', value: 'staff_code' },
      { label: 'メールアドレス', value: 'email' },
      { label: 'ユーザー名', value: 'user_name' },
    ],
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const formData = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const enabledItems = [
  { label: '有効', value: 'active' },
  { label: '無効', value: 'inactive' },
]

const scopeItems = [
  { label: '全体', value: 'all' },
  { label: '全スタッフ', value: 'all_staff' },
  { label: '自分のみ', value: 'self' },
  { label: '自分のスタッフ', value: 'own_staff' },
]

const viewAllow = computed({
  get() {
    return formData.value.view_rule?.allow === true
  },
  set(value) {
    updateField('view_rule', {
      ...(formData.value.view_rule || {}),
      allow: value,
    })
  },
})

const editAllow = computed({
  get() {
    return formData.value.edit_rule?.allow === true
  },
  set(value) {
    updateField('edit_rule', {
      ...(formData.value.edit_rule || {}),
      allow: value,
    })
  },
})

const editIncludes = computed({
  get() {
    return formData.value.edit_rule?.includes || []
  },
  set(value) {
    updateField('edit_rule', {
      ...(formData.value.edit_rule || {}),
      includes: value,
    })
  },
})

const editExcludes = computed({
  get() {
    return formData.value.edit_rule?.excludes || []
  },
  set(value) {
    updateField('edit_rule', {
      ...(formData.value.edit_rule || {}),
      excludes: value,
    })
  },
})

const actionRule = computed({
  get() {
    return Array.isArray(formData.value.action_rule)
      ? formData.value.action_rule
      : []
  },
  set(value) {
    updateField('action_rule', value)
  },
})

const scopeValue = computed({
  get() {
    return formData.value.scope_rule?.scope || ''
  },
  set(value) {
    updateField('scope_rule', {
      ...(formData.value.scope_rule || {}),
      scope: value,
    })
  },
})

const ownStaffCode = computed({
  get() {
    return formData.value.scope_rule?.staff_code || ''
  },
  set(value) {
    updateField('scope_rule', {
      ...(formData.value.scope_rule || {}),
      staff_code: value,
    })
  },
})

function updateField(key, value) {
  formData.value = {
    ...formData.value,
    [key]: value,
  }
}

function buildRules(label, required = false) {
  const rules = []

  if (required) {
    rules.push(v => !!v || `${label}は必須です`)
  }

  return rules
}

function submit() {
  emit('submit', formData.value)
}
</script>

<template>
  <v-form @submit.prevent="submit">
    <v-card variant="outlined">
      <v-card-title>
        権限設定
      </v-card-title>

      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="4">
            <v-select
              :model-value="formData.app_code"
              :items="appItems"
              item-title="label"
              item-value="value"
              label="アプリコード"
              variant="outlined"
              density="comfortable"
              clearable
              :disabled="disabled"
              :rules="buildRules('アプリコード', true)"
              @update:model-value="value => updateField('app_code', value)"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              :model-value="formData.role_code"
              :items="roleItems"
              item-title="label"
              item-value="value"
              label="ロールコード"
              variant="outlined"
              density="comfortable"
              clearable
              :disabled="disabled"
              :rules="buildRules('ロールコード', true)"
              @update:model-value="value => updateField('role_code', value)"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              :model-value="formData.process_code"
              :items="processItems"
              item-title="label"
              item-value="value"
              label="機能コード"
              variant="outlined"
              density="comfortable"
              clearable
              :disabled="disabled"
              :rules="buildRules('機能コード', true)"
              @update:model-value="value => updateField('process_code', value)"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              :model-value="formData.enabled || 'active'"
              :items="enabledItems"
              item-title="label"
              item-value="value"
              label="有効状態"
              variant="outlined"
              density="comfortable"
              :disabled="disabled"
              @update:model-value="value => updateField('enabled', value)"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              :model-value="formData.show_order ?? 0"
              label="表示順"
              type="number"
              variant="outlined"
              density="comfortable"
              :disabled="disabled"
              @update:model-value="value => updateField('show_order', Number(value || 0))"
            />
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <v-row dense>
          <v-col cols="12" md="6">
            <v-card variant="tonal">
              <v-card-title class="text-subtitle-1">
                閲覧権限 view_rule
              </v-card-title>

              <v-card-text>
                <v-switch
                  v-model="viewAllow"
                  label="閲覧を許可する"
                  color="primary"
                  :disabled="disabled"
                  hide-details
                />

                <v-textarea
                  :model-value="JSON.stringify(formData.view_rule || {}, null, 2)"
                  label="view_rule JSON確認"
                  variant="outlined"
                  density="comfortable"
                  rows="4"
                  readonly
                  class="mt-3"
                />
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card variant="tonal">
              <v-card-title class="text-subtitle-1">
                データ範囲 scope_rule
              </v-card-title>

              <v-card-text>
                <v-radio-group
                  v-model="scopeValue"
                  label="参照範囲"
                  :disabled="disabled"
                >
                  <v-radio
                    v-for="item in scopeItems"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </v-radio-group>

                <v-text-field
                  v-if="scopeValue === 'self' || scopeValue === 'own_staff'"
                  v-model="ownStaffCode"
                  label="スタッフコード条件"
                  placeholder="<%own_staff_code%>"
                  variant="outlined"
                  density="comfortable"
                  :disabled="disabled"
                />

                <v-textarea
                  :model-value="JSON.stringify(formData.scope_rule || {}, null, 2)"
                  label="scope_rule JSON確認"
                  variant="outlined"
                  density="comfortable"
                  rows="4"
                  readonly
                  class="mt-3"
                />
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card variant="tonal">
              <v-card-title class="text-subtitle-1">
                編集権限 edit_rule
              </v-card-title>

              <v-card-text>
                <v-switch
                  v-model="editAllow"
                  label="編集を許可する"
                  color="primary"
                  :disabled="disabled"
                  hide-details
                />

                <v-combobox
                  v-model="editIncludes"
                  :items="fieldItems"
                  item-title="label"
                  item-value="value"
                  label="編集可能項目 includes"
                  multiple
                  chips
                  closable-chips
                  clearable
                  variant="outlined"
                  density="comfortable"
                  :disabled="disabled"
                  class="mt-3"
                />

                <v-combobox
                  v-model="editExcludes"
                  :items="fieldItems"
                  item-title="label"
                  item-value="value"
                  label="編集不可項目 excludes"
                  multiple
                  chips
                  closable-chips
                  clearable
                  variant="outlined"
                  density="comfortable"
                  :disabled="disabled"
                />

                <v-textarea
                  :model-value="JSON.stringify(formData.edit_rule || {}, null, 2)"
                  label="edit_rule JSON確認"
                  variant="outlined"
                  density="comfortable"
                  rows="4"
                  readonly
                  class="mt-3"
                />
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card variant="tonal">
              <v-card-title class="text-subtitle-1">
                実行可能アクション action_rule
              </v-card-title>

              <v-card-text>
                <v-select
                  v-model="actionRule"
                  :items="actionItems"
                  item-title="label"
                  item-value="value"
                  label="実行可能アクション"
                  multiple
                  chips
                  closable-chips
                  clearable
                  variant="outlined"
                  density="comfortable"
                  :disabled="disabled"
                />

                <v-textarea
                  :model-value="JSON.stringify(formData.action_rule || [], null, 2)"
                  label="action_rule JSON確認"
                  variant="outlined"
                  density="comfortable"
                  rows="4"
                  readonly
                  class="mt-3"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions v-if="showSubmit">
        <v-spacer />
        <v-btn
          color="primary"
          type="submit"
          variant="flat"
        >
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>


<!-- 

# 親側の初期データ例です。

const permission = ref({
  app_code: 'surupas',
  role_code: 'hr_admin',
  process_code: 'staff_profile',

  view_rule: {
    allow: true,
  },

  edit_rule: {
    allow: true,
    excludes: [],
  },

  action_rule: [
    'create',
    'update',
    'approve',
  ],

  scope_rule: {
    scope: 'all_staff',
  },

  enabled: 'active',
  show_order: 0,
})



# 使い方

<AppRolePermissionForm
  v-model="permission"
  @submit="savePermission"
/>
-->