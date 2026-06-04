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

window.appConfig.UploadFiles = {
    // default config for staff. these items will be gotten from login information
    editable: true, // if editable: false then the own has viewable permission only. if editable:  true then has editing permission
    height: 200,    // number of Pixels
    width:  200,    // number of Pixels
    returnType: 'base64', // 'base64' or 'blob'
    direction: 'row', // 'row' or 'column'
    student_card: {
        editable: true, // if editable: false then the own has viewable permission only. if editable:  true then has editing permission
        height: 360,    // number of Pixels
        width:  360,    // number of Pixels
        returnType: 'blob', // 'base64' or 'blob'
        direction: 'row', // 'row' or 'column'
        files : [// you can define many files to be uloaded
            { field: 'front', headerName: '学生証表'},
            { field: 'back', headerName: '学生証裏'},
            { field: 'diploma', headerName: '卒業書'},
            { field: 'academic_transcript', headerName: '成績書'},
        ],
    },
    mynumber_card: {
        editable: true, // if editable: false then the own has viewable permission only. if editable:  true then has editing permission
        height: 360,    // number of Pixels
        width:  360,    // number of Pixels
        returnType: 'blob', // 'base64' or 'blob'
        direction: 'row', // 'row' or 'column'
        files :[ // you can define many files to be uloaded
            { field: 'front', headerName: 'マイナンバーカード表'},
            { field: 'back', headerName: 'マイナンバーカード裏'},
        ]
    },
};
