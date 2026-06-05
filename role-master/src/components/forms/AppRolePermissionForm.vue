<template>
  <v-card class="pa-4" variant="outlined">
    <v-card-title>アプリ・ロール・機能権限設定</v-card-title>

    <v-row>
      <v-col cols="12" md="4">
        <v-select
          v-model="form.app_code"
          label="アプリコード"
          :items="apps"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="comfortable"
        />
      </v-col>

      <v-col cols="12" md="4">
        <v-select
          v-model="form.role_code"
          label="ロールコード"
          :items="roles"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="comfortable"
        />
      </v-col>

      <v-col cols="12" md="4">
        <v-select
          v-model="form.process_code"
          label="機能コード"
          :items="processes"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
    </v-row>

    <v-divider class="my-4" />

    <!-- 閲覧権限 -->
    <PermissionRuleEditor
      title="閲覧権限ルール"
      v-model="form.view_rule"
      :fields="fields"
    />

    <v-divider class="my-4" />

    <!-- 編集権限 -->
    <PermissionRuleEditor
      title="編集権限ルール"
      v-model="form.edit_rule"
      :fields="fields"
      allow-no-access
    />

    <v-divider class="my-4" />

    <!-- アクション権限 -->
    <v-card variant="outlined" class="pa-4 mb-4">
      <div class="text-h6 mb-3">実行可能アクション</div>

      <v-select
        v-model="form.action_rule"
        label="実行可能アクション"
        :items="actions"
        item-title="label"
        item-value="value"
        multiple
        chips
        closable-chips
        variant="outlined"
        density="comfortable"
      />
    </v-card>

    <!-- 参照範囲 -->
    <v-card variant="outlined" class="pa-4 mb-4">
      <div class="text-h6 mb-3">データ参照範囲</div>

      <v-radio-group v-model="scopeType">
        <v-radio label="全体" value="all" />
        <v-radio label="自分のみ" value="own" />
        <v-radio label="所属部署" value="department" />
        <v-radio label="手入力" value="custom" />
      </v-radio-group>

      <v-textarea
        v-model="scopeText"
        label="scope_rule JSON"
        variant="outlined"
        rows="3"
        auto-grow
      />
    </v-card>

    <v-row>
      <v-col cols="12" md="4">
        <v-select
          v-model="form.enabled"
          label="有効状態"
          :items="[
            { label: '有効', value: 'active' },
            { label: '無効', value: 'inactive' }
          ]"
          variant="outlined"
        />
      </v-col>

      <v-col cols="12" md="4">
        <v-text-field
          v-model.number="form.show_order"
          label="表示順"
          type="number"
          variant="outlined"
        />
      </v-col>
    </v-row>

    <v-alert
      v-if="jsonError"
      type="error"
      variant="tonal"
      class="mb-3"
    >
      {{ jsonError }}
    </v-alert>

    <v-card-actions class="justify-end">
      <v-btn variant="outlined" @click="resetForm">
        クリア
      </v-btn>

      <v-btn color="primary" :disabled="!!jsonError" @click="save">
        保存
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import PermissionRuleEditor from './PermissionRuleEditor.vue'

const apps = [
  { label: 'スタッフ情報管理', value: 'staff' },
  { label: '勤怠管理', value: 'attendance' },
  { label: '契約管理', value: 'contract' },
]

const roles = [
  { label: 'システム管理者', value: 'admin' },
  { label: 'スタッフ', value: 'staff' },
  { label: '部門マネージャー', value: 'department_manager' },
]

const processes = [
  { label: 'スタッフ基本情報', value: 'staff_profile' },
  { label: '銀行情報', value: 'staff_bank' },
  { label: '申請承認', value: 'approval' },
]

const fields = [
  { label: 'スタッフコード', value: 'staff_code' },
  { label: '氏名', value: 'staff_name' },
  { label: '生年月日', value: 'birthday' },
  { label: '住所', value: 'address' },
  { label: '銀行情報', value: 'bank' },
  { label: '承認ボタン', value: 'btn_approval' },
  { label: '承認者', value: 'approved_by' },
  { label: '承認日時', value: 'approved_at' },
]

const actions = [
  { label: '作成', value: 'create' },
  { label: '保存', value: 'save' },
  { label: '更新', value: 'update' },
  { label: '削除', value: 'delete' },
  { label: '申請', value: 'submit' },
  { label: '承認', value: 'approve' },
  { label: '却下', value: 'reject' },
]

const form = reactive({
  app_code: null,
  role_code: null,
  process_code: null,
  view_rule: null,
  edit_rule: null,
  action_rule: [],
  scope_rule: {},
  enabled: 'active',
  show_order: 0,
})

const scopeType = ref('all')
const scopeText = ref('{}')

watch(scopeType, value => {
  if (value === 'all') {
    scopeText.value = '{}'
  } else if (value === 'own') {
    scopeText.value = '{"staff_code":"<%own_staff_code%>"}'
  } else if (value === 'department') {
    scopeText.value = '{"department_id":"<%own_department_id%>"}'
  }
})

const jsonError = computed(() => {
  try {
    form.scope_rule = JSON.parse(scopeText.value || '{}')
    return ''
  } catch (e) {
    return 'scope_rule のJSON形式が正しくありません'
  }
})

function resetForm() {
  form.app_code = null
  form.role_code = null
  form.process_code = null
  form.view_rule = null
  form.edit_rule = null
  form.action_rule = []
  form.scope_rule = {}
  form.enabled = 'active'
  form.show_order = 0
  scopeType.value = 'all'
  scopeText.value = '{}'
}

function save() {
  const payload = {
    ...form,
    scope_rule: JSON.parse(scopeText.value || '{}'),
  }

  console.log('save payload:', payload)

  /*
    DB保存用 payload 例:

    {
      app_code: 'staff',
      role_code: 'admin',
      process_code: 'staff_profile',
      view_rule: null,
      edit_rule: { excludes: ['approved_by', 'approved_at'] },
      action_rule: ['create', 'save', 'update', 'approve'],
      scope_rule: {},
      enabled: 'active',
      show_order: 1
    }
  */
}
</script>