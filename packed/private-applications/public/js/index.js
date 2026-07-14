// index.js
window.appConfig = window.appConfig || {};
window.appConfig.MAIN_CONFIG = {
  debug_mode: true,
  approval_flow: {
    staff_profile: {
      label: '基本情報',
      steps: [
        { name: 'manager_approval', label: '上長承認' },
        { name: 'hr_approval', label: '人事承認' },
      ],
    },
    staff_traffic: {
      label: '通勤情報',
      steps: [
        { name: 'manager_approval', label: '上長承認' },
        { name: 'hr_approval', label: '人事承認' },
      ],
    },
    staff_bank: {
      label: '銀行情報',
      steps: [
        { name: 'manager_approval', label: '上長承認' },
        { name: 'hr_approval', label: '人事承認' },
      ],
    },
    staff_education: {
      label: '資格情報',
      steps: [
        { name: 'manager_approval', label: '上長承認' },
        { name: 'hr_approval', label: '人事承認' },
      ],
    },
  },
  // 各タブのSQLタグを定義
  tab2sqltag_list: {
    basic: {
      label: '基本情報',
      data_key: 'staff_profile',
      jsonb_fields: ['profile_jsonb'],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'staffs.get_staff_profile', save:'staffs.upsert_staff_profile', delete:'staffs.delete_staff_profile' },
      separate_items: ['staff_code', 'profile_version'],// jsonb以外の普通カラム
    },
    bank: {
      label: '銀行情報',
      data_key: 'staff_bank',
      jsonb_fields: [],// jsonb カラムの一覧
      sqltags:{ select:'masters.get_staff_bank', save:'masters.upsert_staff_bank', delete:'masters.delete_staff_bank'}, // jsonb以外の普通カラム
      separate_items: ['bank_code','bank_name','branch_code','branch_name','bank_account_type','bank_account','bank_account_kana','bank_account_kanji','is_primary','enabled','remarks',],
    },

    traffic: {
      label: '通勤情報',
      data_key: 'staff_traffic',
      jsonb_fields: ['traffic_info'],
      sqltags:{ select:'staffs.get_staff_traffic', save:'staffs.upsert_staff_traffic', delete:'staffs.delete_staff_traffic' },
    },

    education: {
      label: '資格情報',
      data_key: 'staff_education',
      jsonb_fields: ['education_info'],
      sqltags:{ select:'masters.get_staff_education', save:'masters.upsert_staff_education', delete:'masters.delete_staff_education' },
    },
  },
};

