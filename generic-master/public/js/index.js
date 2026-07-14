// index.js
window.appConfig = window.appConfig || {};
window.appConfig.MAIN_CONFIG = {
  debug_mode: true,
  // 各タブのSQLタグを定義
  tab2sqltag_list: {
    basic: {
      label: '基本情報',
      data_key: 'staff_profile',
      jsonb_fields: ['data_jsonb'],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'get_staff_category_info', save:'insert_staff_category_info', delete:'staffs.delete_staff_profile' },
      separate_items: ['id', 'staff_id', 'data_type', 'valid_from', 'valid_to', 'source_request_id', 'created_at', 'created_by', 'updated_at', 'updated_by' ],// jsonb以外の普通カラム
    },
    address: {
      label: '住所情報',
      data_key: 'staff_profile',
      jsonb_fields: ['data_jsonb'],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'get_staff_category_info', save:'insert_staff_category_info', delete:'staffs.delete_staff_profile' },
      separate_items: ['id', 'staff_id', 'data_type', 'valid_from', 'valid_to', 'source_request_id', 'created_at', 'created_by', 'updated_at', 'updated_by' ],// jsonb以外の普通カラム
    },
    contact: {
      label: '連絡先情報',
      data_key: 'staff_profile',
      jsonb_fields: ['data_jsonb'],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'get_staff_category_info', save:'insert_staff_category_info', delete:'staffs.delete_staff_profile' },
      separate_items: ['id', 'staff_id', 'data_type', 'valid_from', 'valid_to', 'source_request_id', 'created_at', 'created_by', 'updated_at', 'updated_by' ],// jsonb以外の普通カラム
    },
    mynumber: {
      label: 'マイナンバー情報',
      data_key: 'staff_mynumber',
      jsonb_fields: ['data_jsonb'],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'', save:'', delete:'' },
      separate_items: ['staff_code', 'profile_version'],// jsonb以外の普通カラム
    },
    users: {
      label: 'ログインユーザー情報',
      data_key: 'staff_users',
      jsonb_fields: ['data_jsonb'],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'', save:'', delete:'' },
      separate_items: ['staff_code', 'profile_version'],// jsonb以外の普通カラム
    },
    traffic: {
      label: '通勤情報',
      data_key: 'staff_traffic',
      jsonb_fields: ['traffic_info'],
      sqltags:{ select:'staffs.get_staff_traffic', save:'staffs.upsert_staff_traffic', delete:'staffs.delete_staff_traffic' },
    },
    bank: {
      label: '銀行情報',
      data_key: 'staff_bank',
      jsonb_fields: ['data_jsonb'],// jsonb カラムの一覧
      sqltags:{ select:'get_staff_category_info', save:'insert_staff_category_info', delete:''}, // jsonb以外の普通カラム
      separate_items: ['id', 'staff_id', 'data_type', 'valid_from', 'valid_to', 'source_request_id', 'created_at', 'created_by', 'updated_at', 'updated_by' ],// jsonb以外の普通カラム
    },
    education: {
      label: '教育情報',
      data_key: 'staff_education',
      jsonb_fields: ['education_info'],
      sqltags:{ select:'masters.get_staff_education', save:'masters.upsert_staff_education', delete:'masters.delete_staff_education' },
    },
    dependents: {
      label: '扶養情報',
      data_key: 'staff_dependents',
      jsonb_fields: ['data_jsonb'],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'', save:'', delete:'' },
      separate_items: ['staff_code', 'profile_version'],// jsonb以外の普通カラム
    },
    contract: {
      label: '雇用契約情報',
      data_key: 'staff_contract',
      jsonb_fields: ['data_jsonb'],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'', save:'', delete:'' },
      separate_items: ['staff_code', 'profile_version'],// jsonb以外の普通カラム
    },
    insurance: {
      label: '保険情報',
      data_key: 'staff_insurance',
      jsonb_fields: ['data_jsonb'],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'', save:'', delete:'' },
      separate_items: ['staff_code', 'profile_version'],// jsonb以外の普通カラム
    },
    work_history: {
      label: '職歴情報',
      data_key: 'staff_work_history',
      jsonb_fields: ['data_jsonb'],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'', save:'', delete:'' },
      separate_items: ['staff_code', 'profile_version'],// jsonb以外の普通カラム
    },
    certification: {
      label: '資格情報',
      data_key: 'staff_certification',
      jsonb_fields: ['certification_info'],
      sqltags:{ select:'masters.get_staff_certification', save:'masters.upsert_staff_certification', delete:'masters.delete_staff_certification' },
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
        swapSizeInLandscape: true,
        compressRatio: 1,    // 0.1 ~ 1
        jpegQuality:   0.9,  // 0.1 ~ 1
        outputFormat:  'image/jpeg',
        maxWidth:      0,    // 0 = ignore
        maxHeight:     0,    // 0 = ignore
        files :[ // you can define many files to be uloaded
            { field: 'front', headerName: 'マイナンバーカード表'},
            { field: 'back', headerName: 'マイナンバーカード裏'},
        ]
    },
    bank_book: {
        editable: true, // if editable: false then the own has viewable permission only. if editable:  true then has editing permission
        height: 360,    // number of Pixels
        width:  360,    // number of Pixels
        returnType: 'blob', // 'base64' or 'blob'
        direction: 'row', // 'row' or 'column'
        swapSizeInLandscape: true,
        compressRatio: 1,    // 0.1 ~ 1
        jpegQuality:   0.9,  // 0.1 ~ 1
        outputFormat:  'image/jpeg',
        maxWidth:      0,    // 0 = ignore
        maxHeight:     0,    // 0 = ignore
        files :[ // you can define many files to be uloaded
            { field: 'cover', headerName: '通帳表紙'},
            { field: 'front', headerName: '通帳見開き'},
        ]
    },
    bank_card: {
        editable: true, // if editable: false then the own has viewable permission only. if editable:  true then has editing permission
        height: 360,    // number of Pixels
        width:  360,    // number of Pixels
        returnType: 'blob', // 'base64' or 'blob'
        direction: 'row', // 'row' or 'column'
        swapSizeInLandscape: true,
        compressRatio: 1,    // 0.1 ~ 1
        jpegQuality:   0.9,  // 0.1 ~ 1
        outputFormat:  'image/jpeg',
        maxWidth:      0,    // 0 = ignore
        maxHeight:     0,    // 0 = ignore
        files :[ // you can define many files to be uloaded
            { field: 'front', headerName: '銀行カード'},
        ]
    },
};
