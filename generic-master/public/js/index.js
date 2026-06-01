// index.js
window.appConfig = window.appConfig || {};
window.appConfig.MAIN_CONFIG = {
  debug_mode: true,
  // 各タブのSQLタグを定義
  tab2sqltag_list: {
    basic: {
      label: '基本情報',
      data_key: 'staff_profile',
      save_strategy: 'jsonb_profile',
      jsonb_fields: ['profile_jsonb'],
      skip_reload: true,
      sqltags: {
        select: 'staffs.get_staff_profile',
        save: 'staffs.upsert_staff_profile',
        delete: 'staffs.delete_staff_profile',
      },
    },

    traffic: {
      label: '通勤情報',
      data_key: 'staff_traffic',
      save_strategy: 'jsonb_field',
      jsonb_fields: ['traffic_info'],
      sqltags: {
        select: 'staffs.get_staff_traffic',
        save: 'staffs.save_staff_traffic',
        delete: 'staffs.delete_staff_traffic',
      },
    },

    bank: {
      label: '銀行情報',
      data_key: 'staff_bank',
      save_strategy: 'flat',
      jsonb_fields: [],
      context_fields: ['staff_id', 'staff_code'],
      sqltags: {
        select: 'masters.get_staff_bank',
        save: 'masters.upsert_staff_bank',
        delete: 'masters.delete_staff_bank',
      },
    },

    education: {
      label: '資格情報',
      data_key: 'staff_education',
      save_strategy: 'jsonb_field',
      jsonb_fields: ['education_info'],
      sqltags: {
        select: 'masters.get_staff_education',
        save: 'masters.save_staff_education',
        delete: 'masters.delete_staff_education',
      },
    },
  },
};
