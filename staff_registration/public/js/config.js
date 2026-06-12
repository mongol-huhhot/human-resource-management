// config.js
window.appConfig = window.appConfig || {}

window.appConfig.MAIN_CONFIG = {
  debug_mode: true,

  app_key: 'staff_registration',
  app_name: 'スタッフ情報登録',

  grid: {},
  // Web Component の j から渡される mode
  // 例: applicant-register / pre-join-register / staff-profile / profile-change
  default_mode: 'pre-join-register',

  mode_steps: {
    'applicant-register': [ // 応募時登録
      'basic',
      'work_history',
      'certification',
      'files',
      'confirm',
    ],

    'pre-join-register': [ // 入社時登録
      'basic',
      'bank',
      'traffic',
      'dependents',
      'insurance',
      'files',
      'confirm',
    ],

    'staff-profile': [ // 本番承認情報
      'basic',
      'bank',
      'traffic',
      'dependents',
      'insurance',
      'files',
      'history',
    ],

    'profile-change': [ // 変更
      'basic',
      'bank',
      'traffic',
      'dependents',
      'insurance',
      'files',
      'confirm',
    ],
  },

  group_settings: {
    basic: {
      label: '基本情報・住所・連絡先',
      display_items: ['staff_code', 'staff_name'],

      sqltags: {
        select: 'staff.get_profile_request',
        save: 'staff.save_profile_request',
        delete: 'staff.delete_profile_request',
      },

      jsonb_fields: ['profile_jsonb', 'files'],

      separate_items: [
        'id',
        'request_id',
        'staff_id',
        'staff_code',
        'request_type',
        'request_status',
        'valid_from',
        'enabled',
      ],

      condition: {
        staff_code: null,
        request_id: null,
      },
    },

    bank: {
      label: '銀行口座',
      display_items: ['bank_name', 'branch_name', 'bank_account'],

      sqltags: {
        select: 'staff.get_bank_request',
        save: 'staff.save_bank_request',
        delete: 'staff.delete_bank_request',
      },

      jsonb_fields: [],

      separate_items: [
        'id',
        'staff_code',
        'bank_code',
        'bank_name',
        'branch_code',
        'branch_name',
        'bank_account_type',
        'bank_account',
        'bank_account_kana',
        'bank_account_kanji',
        'is_primary',
        'enabled',
        'remarks',
      ],

      condition: {
        staff_code: null,
        id: null,
      },
    },

    traffic: {
      label: '通勤情報',
      display_items: ['route_name', 'start_station', 'end_station'],

      sqltags: {
        select: 'staff.get_traffic_request',
        save: 'staff.save_traffic_request',
        delete: 'staff.delete_traffic_request',
      },

      jsonb_fields: ['traffic_info'],

      separate_items: [
        'id',
        'staff_code',
        'enabled',
        'remarks',
      ],

      condition: {
        staff_code: null,
        id: null,
      },
    },

    dependents: {
      label: '扶養家族',
      display_items: ['dependent_name', 'relationship'],

      sqltags: {
        select: 'staff.get_dependents_request',
        save: 'staff.save_dependents_request',
        delete: 'staff.delete_dependents_request',
      },

      jsonb_fields: ['dependent_info'],

      separate_items: [
        'id',
        'staff_code',
        'enabled',
        'remarks',
      ],

      condition: {
        staff_code: null,
        id: null,
      },
    },

    insurance: {
      label: '各種保険',
      display_items: ['dependent_name', 'relationship'],

      sqltags: {
        select: 'staff.get_dependents_request',
        save: 'staff.save_dependents_request',
        delete: 'staff.delete_dependents_request',
      },

      jsonb_fields: ['dependent_info'],

      separate_items: [
        'id',
        'staff_code',
        'enabled',
        'remarks',
      ],

      condition: {
        staff_code: null,
        id: null,
      },
    },

    work_history: {
      label: '職務歴',
      display_items: ['company_name', 'position'],

      sqltags: {
        select: 'staff.get_work_history_request',
        save: 'staff.save_work_history_request',
        delete: 'staff.delete_work_history_request',
      },

      jsonb_fields: [],

      separate_items: [
        'id',
        'staff_code',
        'company_name',
        'position',
        'start_date',
        'end_date',
        'remarks',
        'enabled',
      ],

      condition: {
        staff_code: null,
        id: null,
      },
    },

    certification: {
      label: '資格情報',
      display_items: ['certification_name', 'certification_date'],

      sqltags: {
        select: 'staff.get_certification_request',
        save: 'staff.save_certification_request',
        delete: 'staff.delete_certification_request',
      },

      jsonb_fields: [],

      separate_items: [
        'id',
        'staff_code',
        'certification_name',
        'certification_date',
        'expiration_date',
        'remarks',
        'enabled',
      ],

      condition: {
        staff_code: null,
        id: null,
      },
    },

    files: {
      label: '添付書類',
      display_items: ['original_name', 'file_type'],

      sqltags: {
        select: 'staff.get_files_request',
        save: 'staff.save_files_request',
        delete: 'staff.delete_files_request',
      },

      jsonb_fields: ['files'],

      separate_items: [
        'id',
        'staff_code',
        'file_uuid',
        'file_type',
        'enabled',
      ],

      condition: {
        staff_code: null,
        id: null,
      },
    },

    confirm: {
      label: '確認',
      component: 'ConfirmPreview',
      display_items: [],
      sqltags: {},
      jsonb_fields: [],
      separate_items: [],
      condition: {},
    },

    history: {
      label: '履歴',
      component: 'StaffHistoryView',
      display_items: ['valid_from', 'valid_to', 'request_type'],

      sqltags: {
        select: 'staff.get_profile_history',
      },

      jsonb_fields: ['profile_jsonb', 'files'],
      separate_items: [
        'id',
        'staff_code',
        'valid_from',
        'valid_to',
        'request_type',
        'approved_at',
      ],

      condition: {
        staff_code: null,
      },
    },
  },
}
